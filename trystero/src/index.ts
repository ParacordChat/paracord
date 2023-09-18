export { joinRoom as joinFirebaseRoom } from "./firebase";
export { joinRoom as joinIpfsRoom } from "./ipfs";
export { joinRoom, selfId } from "./torrent";
export type {
  BaseRoomConfig,
  FirebaseRoomConfig,
  IpfsRoomConfig,
  Room,
  TorrentRoomConfig,
} from "./types";
