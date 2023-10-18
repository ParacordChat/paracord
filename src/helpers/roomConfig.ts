import {
	BaseRoomConfig,
	FirebaseRoomConfig,
	TorrentRoomConfig
} from "../Distra";

export const tradeName = "paracord_chat";

const rtcConfig = {
	iceServers: [
		{
			urls: "stun:188.148.133.173:3478"
		},
		{
			urls: "turn:188.148.133.173:3478",
			username: "c386d75b5633456cb3bc13812858098d",
			credential: "58fd06d85fe14c0f9f46220748b0f565"
		},
		{
			urls: "turn:openrelay.metered.ca:80",
			username: "openrelayproject",
			credentials: "openrelayproject"
		}
	]
};

export const defaultRoomConfig: BaseRoomConfig & TorrentRoomConfig = {
	appId: tradeName,
	rtcConfig
};

export const firebaseRoomConfig: FirebaseRoomConfig = {
	appId: "paracord-d5594-default-rtdb",
	rtcConfig
};
