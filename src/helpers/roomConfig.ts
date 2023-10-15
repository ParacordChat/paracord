import {
	BaseRoomConfig,
	FirebaseRoomConfig,
	TorrentRoomConfig
} from "trystero";

export const tradeName = "paracord_chat";

export const defaultRoomConfig: BaseRoomConfig & TorrentRoomConfig = {
	appId: tradeName,
	rtcConfig: {
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
				urls: "turn:188.148.133.173:3478",
				username: "0e2f563eacfd4c4a82ea239b04d1d494",
				credential: "8179b4b533f240ad9fe590663bef1bc9"
			},
			{
				urls: "turn:188.148.133.173:3478",
				username: "feab95c3fcd147a2a96a3d3590bf9cda",
				credential: "654cafd885424b7fb974e65f631f25f9"
			}
		]
	}
};

export const firebaseRoomConfig: FirebaseRoomConfig = {
	appId: "paracord-d5594-default-rtdb"
};
