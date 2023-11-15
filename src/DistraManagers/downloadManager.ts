import { funAnimalName } from "fun-animal-names";
import { showSaveFilePicker } from "native-file-system-adapter";
import { Room, selfId } from "../Distra/index";
import { sendSystemMessage } from "../helpers/helpers";
import { FileAck, FileMetaData, FileOffer } from "../helpers/types/types";
import { genId } from "../helpers/utils";
import { useProgressStore } from "../stateManagers/downloadManagers/progressManager";
import { useRealFiles } from "../stateManagers/downloadManagers/realFileManager";
import { useOfferStore } from "../stateManagers/downloadManagers/requestManager";
import { useClientSideUserTraits } from "../stateManagers/userManagers/clientSideUserTraits";
import { useUserStore } from "../stateManagers/userManagers/userStore";

const chunkSize = 1_000_000 * 5; // 5MB

const readFileChunk = (data: File, chunkN: number) =>
	data
		.slice(chunkN * chunkSize, (chunkN + 1) * chunkSize)
		.arrayBuffer()
		.then((buffer: ArrayBuffer) => new Uint8Array(buffer));

const calcProgress = ({
	chunkN,
	rawProg,
	fullSize,
	uuid,
	id,
	name,
	toUser
}: {
	// TODO: pretty bad
	chunkN: number;
	rawProg: number;
	fullSize: number;
	uuid: string;
	id: string;
	name: string;
	toUser: string;
}) => {
	const progress = Number(
		((chunkN + rawProg) / (Math.ceil(fullSize / chunkSize) + 1)).toFixed(4)
	);
	if (progress >= 1) {
		useProgressStore.getState()
			.deleteProgress(uuid);
	} else {
		useProgressStore.getState()
			.updateOrAddProgress(uuid, {
				id,
				uuid,
				name,
				chunkN,
				progress,
				toUser
			});
	}
};

export default class DownloadManager {
	private sendFileOffer;
	private sendFileAck;
	private terminateClient: (toId: string, uuid: string) => void;

	constructor({ room, roomId }: { room: Room; roomId: string }) {
		const [sendFileChunk, getFileChunk, onFileProgress] =
			room.makeAction<Uint8Array>("transfer", true);
		const [sendFileOffer, getFileOffer] = room.makeAction<FileOffer[]>(
			"fileOffer",
			true
		);
		const [sendFileAck, getFileAck] = room.makeAction<FileAck>("fileAck", true);
		this.sendFileOffer = sendFileOffer;
		this.sendFileAck = sendFileAck;
		this.terminateClient = (toId, uuid) =>
			sendFileChunk(new Uint8Array(), [toId], {
				uuid,
				chunkN: -1
			});

		useUserStore.subscribe((state, prevState) => {
			if (state.keyedUsers.size > prevState.keyedUsers.size) {
				this.offerRequestableFiles();
			}
		});

		// if ( //TODO: reimplement
		// 	useProgressStore
		// 		.getState()
		// 		.progressQueue.some((p) => p.id === fileReq.id && p.toUser === userId)
		// ) {
		// 	confirmDialog(
		// 		`file already being sent, you can click ok to send it again, or mute the user with id ${funAnimalName(
		// 			userId
		// 		)} to prevent spamming`
		// 	)
		// 		.then((ok) => {
		// 			if (ok) {
		// 				sendAction(realFile);
		// 			} else {
		// 				alert("other user rejected your download request!");
		// 			}
		// 		})
		// 		.catch(() => {
		// 			this.terminateClient(userId, fileReq.uuid);
		// 		});
		// } else {
		// 	sendAction(realFile);
		// }
		//

		getFileAck(async (fileAck, userId) => {
			const userMuted = useClientSideUserTraits.getState().mutedUsers[userId];
			if (userMuted) return;

			const currentFile = useRealFiles.getState().realFiles[fileAck.id];
			if (!currentFile) return;
			const totalChunks = Math.ceil(currentFile.size / chunkSize);

			if (fileAck.chunkN === -1) {
				useProgressStore.getState()
					.deleteProgress(fileAck.uuid);
				return;
			}

			await readFileChunk(currentFile, fileAck.chunkN)
				.then((chunk) => {
					return sendFileChunk(
						chunk,
						[userId],
						{
							id: fileAck.id,
							uuid: fileAck.uuid,
							chunkN: fileAck.chunkN,
							name: currentFile.name,
							size: currentFile.size,
							last: fileAck.chunkN === totalChunks
						},
						(chkProgress: number, _fromUser: any) =>
							calcProgress({
								chunkN: fileAck.chunkN,
								rawProg: chkProgress,
								fullSize: currentFile.size,
								uuid: fileAck.uuid,
								id: fileAck.id,
								name: currentFile.name,
								toUser: userId
							})
					);
				})
				.catch((error: Error) => console.error(error));
		});

		onFileProgress((rawProgress, _id, metadata) => {
			if (metadata === undefined) return;
			const processedMeta = metadata as FileMetaData;
			calcProgress({
				chunkN: processedMeta.chunkN,
				rawProg: rawProgress,
				fullSize: processedMeta.size,
				uuid: processedMeta.uuid,
				id: processedMeta.id,
				name: processedMeta.name,
				toUser: selfId
			});
		});

		getFileChunk(async (fileReceipt, _id, metadata) => {
			const processedMeta = metadata as FileMetaData;
			if (processedMeta.chunkN && processedMeta.chunkN === -1) {
				useProgressStore.getState()
					.removeWritable(processedMeta.uuid);
				useProgressStore.getState()
					.deleteProgress(processedMeta.uuid);
				return;
			}
			const fwrt = useProgressStore
				.getState()
				.writablesQueue.find((w) => w.uuid === processedMeta.uuid)?.writable;
			if (fwrt) {
				await fwrt.write(fileReceipt)
					.then(() => {
						if (processedMeta.last) {
							useProgressStore.getState()
								.removeWritable(processedMeta.uuid);
						// this.sendFileAck({
						// 	uuid: processedMeta.uuid,
						// 	id: processedMeta.id,
						// 	chunkN: -1
						// });
						} else {
							return sendFileAck({
								uuid: processedMeta.uuid,
								id: processedMeta.id,
								chunkN: processedMeta.chunkN + 1
							});
						}
					});
			}
		});

		getFileOffer(async (data, id) => {
			if (useClientSideUserTraits.getState().mutedUsers[id] !== true) {
				useOfferStore.getState()
					.updateOrAddRequestable(id, data);
				if (data.length > 0) {
					sendSystemMessage(roomId, `${funAnimalName(id)} offered you files`);
					if (useClientSideUserTraits.getState().activeTab !== "downloads") {
						useClientSideUserTraits.getState()
							.addtoNotifyTabs("downloads");
					}
				}
			}
		});
	}

	public requestFile = async (fromUser: string, fileId: string) => {
		const requestableFiles =
			useOfferStore.getState().requestableDownloads[fromUser];
		const findName =
			requestableFiles && requestableFiles.find((f) => f.id === fileId);
		if (findName) {
			const fileUUID = genId(6);
			await showSaveFilePicker({
				suggestedName: findName.name,
				excludeAcceptAllOption: false // default
			})
				.then(async (fileHandle) => {
					useProgressStore.getState()
						.addProgress({
							id: findName.id,
							uuid: fileUUID,
							name: findName.name,
							chunkN: 0,
							progress: 0,
							toUser: selfId
						});
					return fileHandle;
				})
				.then((fileHandle) => fileHandle.createWritable())
				.then((fileWriter) =>
					useProgressStore.getState()
						.addWritable({
							fileId: findName.id,
							uuid: fileUUID,
							writable: fileWriter
						})
				)
				.then(() =>
					this.sendFileAck(
						{
							uuid: fileUUID,
							id: findName.id,
							chunkN: 0
						},
						[fromUser]
					)
				);
		} else {
			alert("file not found!");
		}
	};

	public offerRequestableFiles = async (ids?: string[]) => {
		const realFiles = useRealFiles.getState().realFiles;
		if (!realFiles || Object.keys(realFiles).length === 0) {
			this.sendFileOffer([], ids)
				.catch((error) => console.error(error));
			return;
		}
		const files: FileOffer[] = Object.entries(realFiles)
			.map(
				([fileId, file]) => ({
					id: fileId,
					ownerId: selfId,
					name: file.name,
					size: file.size
				})
			);

		// await
		this.sendFileOffer(files, ids)
			.catch((error) => console.error(error));
	};

	public removeRealFile = (id: string) => {
		useProgressStore.getState()
			.deleteFid(id);
		useRealFiles.getState()
			.deleteRealFile(id);
		this.offerRequestableFiles();
	};

	public addRealFiles = (initialList: File[]) => {
		useRealFiles.getState()
			.addRealFiles(initialList);
		this.offerRequestableFiles();
	};

	public attemptResume = async (uuid: string) => {
		const progressSeek = useProgressStore
			.getState()
			.progressQueue.find((p) => p.uuid === uuid);

		if (progressSeek) {
			this.sendFileAck({
				uuid,
				id: progressSeek.id,
				chunkN: progressSeek.chunkN
			});
		}
	};

	// public pauseFile = (uuid: string) => {
	// TODO: add back
	// };

	public cancelFile = (uuid: string) => {
		const progressSeek = useProgressStore
			.getState()
			.progressQueue.find((p) => p.uuid === uuid);

		if (progressSeek) {
			if (progressSeek.toUser === selfId) {
				useProgressStore.getState()
					.removeWritable(uuid);
				this.sendFileAck({
					uuid,
					id: progressSeek.id,
					chunkN: -1
				});
			} else {
				this.terminateClient(progressSeek.toUser, uuid);
			}
			useProgressStore.getState()
				.deleteProgress(uuid);
		}
	};

	public peerJoinHook = (id: string) =>
		setTimeout(() => this.offerRequestableFiles([id]), 5000); // TODO: kind of an ugly fix, but it works
}
