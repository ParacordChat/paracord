import { funAnimalName } from "fun-animal-names";
import { Room, selfId } from "trystero";
import { confirmDialog, sendSystemMessage } from "../helpers/helpers";
import { FileMetaData, FileOffer } from "../helpers/types";
import { useProgressStore } from "../stateManagers/downloadManagers/progressManager";
import { useRealFiles } from "../stateManagers/downloadManagers/realFileManager";
import { useOfferStore } from "../stateManagers/downloadManagers/requestManager";
import { useClientSideUserTraits } from "../stateManagers/userManagers/clientSideUserTraits";
import { useUserStore } from "../stateManagers/userManagers/userStore";

export default class DownloadManager {
	private sendFileRequest: (
		id: string,
		ids?: string | string[]
	) => Promise<any[]>;
	private sendFileOffer: (
		files: FileOffer[],
		ids?: string | string[]
	) => Promise<any[]>;

	constructor({ room, roomId }: { room: Room; roomId: string }) {
		const [sendFile, getFile, onFileProgress] = room.makeAction<File>(
			"transfer",
			true
		);
		const [sendFileRequest, getFileRequest] = room.makeAction<string>(
			"fileRequest",
			true
		);
		const [sendFileOffer, getFileOffer] = room.makeAction<FileOffer[]>(
			"fileOffer",
			true
		);
		this.sendFileRequest = sendFileRequest;
		this.sendFileOffer = sendFileOffer;

		useUserStore.subscribe((state, prevState) => {
			if (state.keyedUsers.size > prevState.keyedUsers.size) {
				this.offerRequestableFiles();
			}
		});

		onFileProgress((progress, _id, metadata) => {
			const processedMeta = metadata as FileMetaData;
			useProgressStore
				.getState()
				.updateProgress(processedMeta.id, { progress });
		});

		getFileRequest((fileId, userId) => {
			const realFiles = useRealFiles.getState().realFiles;
			const mutedUsers = useClientSideUserTraits.getState().mutedUsers;
			if (realFiles && fileId in realFiles && mutedUsers[userId] !== true) {
				const sendAction = () => {
					const currentFile = realFiles[fileId];

					useProgressStore.getState()
						.addProgress({
							id: fileId,
							name: currentFile.name,
							progress: 0,
							toUser: userId
						});
					sendFile(
						currentFile,
						userId,
						{
							id: fileId,
							name: currentFile.name,
							size: currentFile.size
						},
						(progress, _fromUser) => {
							useProgressStore.getState()
								.updateProgress(fileId, { progress });
						}
					);
				};
				if (
					useProgressStore
						.getState()
						.progressQueue.some((p) => p.id === fileId && p.toUser === userId)
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
						});
				} else {
					sendAction();
				}
			}
		});

		getFile((_success, _id, metadata) => {
			const processedMeta = metadata as FileMetaData;
			useProgressStore.getState()
				.deleteProgress(processedMeta.id);
		});

		getFileOffer(async (data, id) => {
			if (useClientSideUserTraits.getState().mutedUsers[id] !== true) {
				useOfferStore.getState()
					.updateOrAddRequestable(id, data);

				sendSystemMessage(roomId, `${id} offered you files`);
			}
		});
	}

	public requestFile = async (fromUser: string, fileId: string) => {
		const requestableFiles =
			useOfferStore.getState().requestableDownloads[fromUser];
		const findName =
			requestableFiles && requestableFiles.find((f) => f.id === fileId);
		if (findName) {
			useProgressStore.getState()
				.addProgress({
					id: findName.id,
					name: findName.name,
					progress: 0,
					toUser: selfId
				});
			this.sendFileRequest(fileId, fromUser);
		} else {
			alert("file not found!");
		}
	};

	public offerRequestableFiles = async () => {
		const realFiles = useRealFiles.getState().realFiles;
		if (!realFiles || Object.keys(realFiles).length === 0) return;
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
		this.sendFileOffer(files)
			.catch((error) => console.error(error));
	};

	public removeRealFile = (id: string) => {
		useProgressStore.getState()
			.deleteProgress(id);
		useRealFiles.getState()
			.deleteRealFile(id);
	};

	public addRealFiles = (initialList: File[]) => {
		useRealFiles.getState()
			.addRealFiles(initialList);
		this.offerRequestableFiles();
	};
}
