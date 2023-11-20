import { FirebaseRoomConfig, TorrentRoomConfig } from "../../Distra";

export const tradeName = "paracord_chat";

export const turnAPI =
  "https://paracord.metered.live/api/v1/turn/credentials?apiKey=97a4d31acf5e4c6fe6fb573eecc0f9f4ccbf";

export const trackerUrls = [
	"wss://fediverse.tv/tracker/socket",
	"wss://tracker.files.fm:7073/announce",
	"wss://tracker.openwebtorrent.com",
	"wss://tracker.btorrent.xyz",
	"wss://qot.abiir.top:443/announce",
	"wss://spacetradersapi-chatbox.herokuapp.com:443/announce"
];

export const torrentRoomConfig: TorrentRoomConfig = {
	appId: tradeName,
	trackerUrls
};

export const firebaseRoomConfig: FirebaseRoomConfig = {
	appId: "paracord-d5594-default-rtdb"
};

export type RoomStrategy = "firebase" | "torrent";
export const roomStrategyUrl: Record<RoomStrategy, string> = {
	firebase: "f",
	torrent: "t"
};
export const strategyList = Object.keys(roomStrategyUrl) as RoomStrategy[];
