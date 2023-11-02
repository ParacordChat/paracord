import { FirebaseRoomConfig, TorrentRoomConfig } from "../../Distra";

export const tradeName = "paracord_chat";

export const turnAPI =
	"https://paracord.metered.live/api/v1/turn/credentials?apiKey=97a4d31acf5e4c6fe6fb573eecc0f9f4ccbf";

export const defaultRoomConfig: TorrentRoomConfig = {
	appId: tradeName
};

export const firebaseRoomConfig: FirebaseRoomConfig = {
	appId: "paracord-d5594-default-rtdb"
};
