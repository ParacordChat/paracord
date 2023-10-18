import { funAnimalName } from "fun-animal-names";
import { showSaveFilePicker } from "native-file-system-adapter";
import { Room, selfId } from "../Distra";
import {
  confirmDialog,
  sendSystemMessage,
  uuidSource,
} from "../helpers/helpers";
import { FileMetaData, FileOffer, FileRequest } from "../helpers/types";
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
  private sendFileRequest: (
    id: FileRequest,
    ids?: string | string[],
  ) => Promise<any[]>;
  private sendFileOffer: (
    files: FileOffer[],
    ids?: string | string[],
  ) => Promise<any[]>;

  constructor({ room, roomId }: { room: Room; roomId: string }) {
    const [sendFileChunk, getFileChunk, onFileProgress] =
      room.makeAction<Uint8Array>("transfer", true);
    const [sendFileRequest, getFileRequest] = room.makeAction<FileRequest>(
      "fileRequest",
      true,
    );
    const [sendFileOffer, getFileOffer] = room.makeAction<FileOffer[]>(
      "fileOffer",
      true,
    );
    this.sendFileRequest = sendFileRequest;
    this.sendFileOffer = sendFileOffer;

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

          useProgressStore.getState().addProgress({
            id: fileReq.id,
            uuid: fileReq.uuid,
            name: currentFile.name,
            progress: 0,
            toUser: userId,
          });

          const totalChunks = Math.ceil(currentFile.size / chunkSize);
          for (let i = 0; i < totalChunks; i++) {
            await readFileChunk(currentFile, i).then((chunk) =>
              sendFileChunk(
                chunk,
                userId,
                {
                  id: fileReq.id,
                  uuid: fileReq.uuid,
                  chunkN: i,
                  name: currentFile.name,
                  size: currentFile.size,
                  last: i === totalChunks - 1,
                },
                (chkProgress: number, _fromUser: any) => {
                  const progress =
                    ((i + chkProgress) * chunkSize) / currentFile.size;
                  if (progress > 1) {
                    useProgressStore.getState().deleteProgress(fileReq.uuid);
                  } else {
                    useProgressStore
                      .getState()
                      .updateProgress(fileReq.uuid, { progress });
                  }
                },
              ),
            );
          }
        };
        if (
          useProgressStore
            .getState()
            .progressQueue.some(
              (p) => p.id === fileReq.id && p.toUser === userId,
            )
        ) {
          confirmDialog(
            `file already being sent, you can click ok to send it again, or mute the user with id ${funAnimalName(
              userId,
            )} to prevent spamming`,
          ).then((ok) => {
            if (ok) {
              sendAction();
            }
          });
        } else {
          sendAction();
        }
      }
    });

    onFileProgress((rawProgress, _id, metadata) => {
      const processedMeta = metadata as FileMetaData;
      const progress =
        ((processedMeta.chunkN + rawProgress) * chunkSize) / processedMeta.size;

      processedMeta.uuid &&
        useProgressStore
          .getState()
          .updateProgress(processedMeta.uuid, { progress });
      if (processedMeta.last && progress > 1) {
        useProgressStore.getState().deleteProgress(processedMeta.uuid);
      }
    });

    getFileChunk(async (fileReceipt, _id, metadata) => {
      const processedMeta = metadata as FileMetaData;
      const fwrt = useProgressStore
        .getState()
        .writablesQueue.find((w) => w.uuid === processedMeta.uuid)?.writable;
      if (fwrt) await fwrt.write(fileReceipt);
      if (processedMeta.last) {
        useProgressStore.getState().removeWritable(processedMeta.uuid);
      }
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
      const fileUUID = uuidSource();
      await showSaveFilePicker({
        suggestedName: findName.name,
        excludeAcceptAllOption: false, // default
      })
        .then(async (fileHandle) => {
          useProgressStore.getState().addProgress({
            id: findName.id,
            uuid: fileUUID,
            name: findName.name,
            progress: 0,
            toUser: selfId,
          });
          return fileHandle;
        })
        .then((fileHandle) => fileHandle.createWritable())
        .then((fileWriter) =>
          useProgressStore.getState().addWritable({
            fileId: findName.id,
            uuid: fileUUID,
            writable: fileWriter,
          }),
        )
        .then(() =>
          this.sendFileRequest(
            {
              id: findName.id,
              uuid: fileUUID,
            },
            fromUser,
          ),
        );
    } else {
      alert("file not found!");
    }
  };

  public offerRequestableFiles = async (id?: string | string[]) => {
    const realFiles = useRealFiles.getState().realFiles;
    if (!realFiles || Object.keys(realFiles).length === 0) return;
    const files: FileOffer[] = Object.entries(realFiles).map(
      ([fileId, file]) => ({
        id: fileId,
        ownerId: selfId,
        name: file.name,
        size: file.size,
      }),
    );

    // await
    this.sendFileOffer(files, id).catch((error) => console.error(error));
  };

  public removeRealFile = (id: string) => {
    useProgressStore.getState().deleteProgress(id);
    useRealFiles.getState().deleteRealFile(id);
  };

  public addRealFiles = (initialList: File[]) => {
    useRealFiles.getState().addRealFiles(initialList);
    this.offerRequestableFiles();
  };

  public peerJoinHook = (id: string) =>
    setTimeout(() => this.offerRequestableFiles(id), 5000); // TODO: kind of an ugly fix, but it works
}
