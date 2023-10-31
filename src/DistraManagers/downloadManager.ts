import { funAnimalName } from "fun-animal-names";
import { showSaveFilePicker } from "native-file-system-adapter";
import { Room, selfId } from "../Distra";
import { confirmDialog, sendSystemMessage } from "../helpers/helpers";
import {
	FileAck,
	FileMetaData,
	FileOffer,
	FileRequest
} from "../helpers/types/types";
import { genId } from "../helpers/utils";
import { useProgressStore } from "../stateManagers/downloadManagers/progressManager";
import { useRealFiles } from "../stateManagers/downloadManagers/realFileManager";
import { useOfferStore } from "../stateManagers/downloadManagers/requestManager";
import { useClientSideUserTraits } from "../stateManagers/userManagers/clientSideUserTraits";
import { useUserStore } from "../stateManagers/userManagers/userStore";

const chunkSize = 1_000_000 * 20; // 20MB

const readFileChunk = (data: File, chunkN: number) =>
	new Promise<Uint8Array>((res, rej) => {
		const dataStart = chunkN * chunkSize;
		const dataEnd = (chunkN + 1) * chunkSize;

		data
			.slice(dataStart, dataEnd)
			.arrayBuffer()
			.then((buffer: ArrayBuffer) => res(new Uint8Array(buffer)))
			.catch((error: Error) => rej(error));
	});

export default class DownloadManager {
	private sendFileRequest;
	private sendFileOffer;
	private sendFileAck;
	private terminateClient: (toId: string, uuid: string) => void;

	constructor({ room, roomId }: { room: Room; roomId: string }) {
		const [sendFileChunk, getFileChunk, onFileProgress] =
      room.makeAction<Uint8Array>("transfer", true);
		const [sendFileRequest, getFileRequest] = room.makeAction<FileRequest>(
			"fileRequest",
			true
		);
		const [sendFileOffer, getFileOffer] = room.makeAction<FileOffer[]>(
			"fileOffer",
			true
		);
		const [sendFileAck, getFileAck] = room.makeAction<FileAck>("fileAck", true);
		this.sendFileRequest = sendFileRequest;
		this.sendFileOffer = sendFileOffer;
		this.sendFileAck = sendFileAck;
		this.terminateClient = (toId, uuid) =>
			sendFileChunk(
				new Uint8Array(),
				toId,
				{
					uuid,
					chunkN: -1
				},
				() => {}
			);

		useUserStore.subscribe((state, prevState) => {
			if (state.keyedUsers.size > prevState.keyedUsers.size) {
				this.offerRequestableFiles();
			}
		});

		getFileRequest((fileReq, userId) => {
			const realFiles = useRealFiles.getState().realFiles;
			const mutedUsers = useClientSideUserTraits.getState().mutedUsers;
			if (realFiles && fileReq.id in realFiles && mutedUsers[userId] !== true) {
				const sendAction = async () => {
					const currentFile = realFiles[fileReq.id];

					useProgressStore.getState()
						.addProgress({
							id: fileReq.id,
							uuid: fileReq.uuid,
							name: currentFile.name,
							chunkN: 0,
							progress: 0,
							toUser: userId
						});

					await readFileChunk(currentFile, 0)
						.then((chunk) =>
							sendFileChunk(
								chunk,
								userId,
								{
									id: fileReq.id,
									uuid: fileReq.uuid,
									chunkN: 0,
									name: currentFile.name,
									size: currentFile.size,
									last: false
								},
								(chkProgress: number, _fromUser: any) => {
									const progress = (chkProgress * chunkSize) / currentFile.size;
									if (progress > 1) {
										useProgressStore.getState()
											.deleteProgress(fileReq.uuid);
									} else {
										useProgressStore
											.getState()
											.updateProgress(fileReq.uuid, { progress });
									}
								}
							)
						);
				};
				if (
					useProgressStore
						.getState()
						.progressQueue.some(
							(p) => p.id === fileReq.id && p.toUser === userId
						)
				) {
					confirmDialog(
						`file already being sent, you can click ok to send it again, or mute the user with id ${funAnimalName(
							userId
						)} to prevent spamming`
					)
						.then((ok) => {
							if (ok) {
								sendAction();
							}
						})
						.catch(() => {
							this.terminateClient(userId, fileReq.uuid);
						});
				} else {
					sendAction();
				}
			}
		});

		getFileAck(async (fileAck, userId) => {
			const currentFile = useRealFiles.getState().realFiles[fileAck.id];
			const totalChunks = Math.ceil(currentFile.size / chunkSize);

			if (fileAck.chunkN === -1) {
				useProgressStore.getState()
					.deleteProgress(fileAck.uuid);
				return;
			}

			if (fileAck.chunkN < totalChunks) {
				await readFileChunk(currentFile, fileAck.chunkN)
					.then((chunk) =>
						sendFileChunk(
							chunk,
							userId,
							{
								id: fileAck.id,
								uuid: fileAck.uuid,
								chunkN: fileAck.chunkN + 1,
								name: currentFile.name,
								size: currentFile.size,
								last: fileAck.chunkN === totalChunks - 1
							},
							(chkProgress: number, _fromUser: any) => {
								const progress =
                ((fileAck.chunkN + chkProgress) * chunkSize) / currentFile.size;
								if (progress > 1) {
									useProgressStore.getState()
										.deleteProgress(fileAck.uuid);
								} else {
									useProgressStore.getState()
										.updateProgress(fileAck.uuid, {
											progress,
											chunkN: fileAck.chunkN + 1
										});
								}
							}
						)
					);
			}
		});

		onFileProgress((rawProgress, _id, metadata) => {
			if (metadata === undefined) return;
			const processedMeta = metadata as FileMetaData;
			const progress =
        ((processedMeta.chunkN + rawProgress) * chunkSize) / processedMeta.size;

			processedMeta.uuid &&
        useProgressStore
        	.getState()
        	.updateProgress(processedMeta.uuid, { progress });
			if (processedMeta.last && progress > 1) {
				useProgressStore.getState()
					.deleteProgress(processedMeta.uuid);
			}
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
						} else {
							sendFileAck({
								uuid: processedMeta.uuid,
								id: processedMeta.id,
								chunkN: processedMeta.chunkN
							});
						}
					});
			}
			// if (processedMeta.last) {
			// 	useProgressStore.getState()
			// 		.removeWritable(processedMeta.uuid);
			// }
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
					this.sendFileRequest(
						{
							id: findName.id,
							uuid: fileUUID
						},
						fromUser
					)
				);
		} else {
			alert("file not found!");
		}
	};

	public offerRequestableFiles = async (id?: string | string[]) => {
		const realFiles = useRealFiles.getState().realFiles;
		if (!realFiles || Object.keys(realFiles).length === 0) {
			this.sendFileOffer([], id)
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
		this.sendFileOffer(files, id)
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
					// TODO: this is a hack man!
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
		setTimeout(() => this.offerRequestableFiles(id), 5000); // TODO: kind of an ugly fix, but it works
}
