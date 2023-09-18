import { Room, selfId } from "trystero";
import { sendSystemMessage } from "../helpers/helpers";
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
    const [sendFile, getFile, onFileProgress] = room.makeAction("transfer");
    const [sendFileRequest, getFileRequest] = room.makeAction("fileRequest");
    const [sendFileOffer, getFileOffer] = room.makeAction("fileOffer");
    this.sendFileRequest = sendFileRequest;
    this.sendFileOffer = sendFileOffer;

    onFileProgress((progress, _id, metadata) => {
      const processedMeta = metadata as FileMetaData;
      useProgressStore
        .getState()
        .updateProgress(processedMeta.id, { progress });
    });

    getFileRequest((fileId, userId) => {
      const realFiles = useRealFiles.getState().realFiles;
      if (realFiles && fileId in realFiles) {
        const currentFile = realFiles[fileId];
        useProgressStore.getState().addProgress({
          id: fileId,
          name: currentFile.name,
          progress: 0,
          toMe: false,
        });
        sendFile(
          currentFile,
          userId,
          {
            id: fileId,
            name: currentFile.name,
            size: currentFile.size,
          },
          (progress, _fromUser) =>
            useProgressStore.getState().updateProgress(fileId, { progress })
        );
      }
    });

    getFile((_success, _id, metadata) => {
      const processedMeta = metadata as FileMetaData;
      console.log(useProgressStore.getState().progressQueue);
      console.log(processedMeta);
      useProgressStore.getState().deleteProgress(processedMeta.id);
    });

    getFileOffer(async (data, id) => {
      if (useClientSideUserTraits.getState().mutedUsers[id] !== true) {
        useOfferStore.getState().updateOrAddRequestable(id, data);

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
      useProgressStore.getState().addProgress({
        id: findName.id,
        name: findName.name,
        progress: 0,
        toMe: true,
      });
      this.sendFileRequest(fileId, fromUser);
    } else {
      alert("file not found!");
    }
  };

  public offerRequestableFiles = async () => {
    const realFiles = useRealFiles.getState().realFiles;
    if (!realFiles) return;
    const files: FileOffer[] = Object.entries(realFiles).map(
      ([fileId, file]) => ({
        id: fileId,
        ownerId: selfId,
        name: file.name,
        size: file.size,
      })
    );

    const recipientUsers = useUserStore.getState().users.map((user) => user.id);

    //await
    this.sendFileOffer(files, recipientUsers).catch((e) => console.error(e));
  };

  public removeRealFile = (id: string) => {
    useProgressStore.getState().deleteProgress(id);
    useRealFiles.getState().deleteRealFile(id);
  };

  public addRealFiles = (initialList: File[]) => {
    useRealFiles.getState().addRealFiles(initialList);
    this.offerRequestableFiles();
  };
}
