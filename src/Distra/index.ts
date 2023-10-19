export { getOccupants, joinRoom as joinFirebaseRoom } from "./strategies/firebase.js";
export type {
	BaseRoomConfig,
	FirebaseRoomConfig,
	Room,
	TorrentRoomConfig
} from "../helpers/types/distraTypes.js";
export { selfId } from "../helpers/utils.js";
export { joinRoom } from "./strategies/torrent.js";
