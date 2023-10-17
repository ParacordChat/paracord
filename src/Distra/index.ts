export { getOccupants, joinRoom as joinFirebaseRoom } from "./firebase.js";
export type {
	BaseRoomConfig,
	FirebaseRoomConfig,
	Room,
	TorrentRoomConfig
} from "./helpers/types.js";
export { selfId } from "./helpers/utils.js";
export { joinRoom } from "./torrent.js";

