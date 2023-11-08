import Peer from "simple-peer-light";
import { FirebaseRoomConfig, TorrentRoomConfig } from "../Distra";
import { libName } from "./consts/consts";
import { ExtendedInstance, Room } from "./types/distraTypes";

const charSet =
	"0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const initPeer = (
	initiator: boolean,
	trickle: boolean,
	config: RTCConfiguration | undefined
) => {
	const peer: ExtendedInstance = new Peer({
		initiator,
		trickle,
		config,
		streams: []
	}) as ExtendedInstance;

	return peer;
};

export const genId = (n: number) =>
	Array.from({ length: n })
		.fill("")
		.map(() => charSet[Math.floor(Math.random() * charSet.length)])
		.join("");

export const mkErr = (msg: string) => new Error(`${libName}: ${msg}`);

export const initGuard =
	(
		occupiedRooms: { [x: string]: any },
		f: (config: any, ns: string | number) => Promise<Room>
	) =>
		async (
			config: TorrentRoomConfig | FirebaseRoomConfig,
			ns: string | number
		): Promise<Room> => {
			if (occupiedRooms[ns]) {
				throw mkErr(`already joined room ${ns}`);
			}

			if (!config) {
				throw mkErr("requires a config map as the first argument");
			}

			if (!ns) {
				throw mkErr("namespace argument required");
			}

			return await f(config, ns);
		};

export const firebaseGuard =
	(
		occupiedRooms: { [x: string]: any },
		f: (config: any, ns: string | number) => Promise<string[]>
	) =>
		async (
			config: FirebaseRoomConfig,
			ns: string | number
		): Promise<string[]> => {
			if (occupiedRooms[ns]) {
				throw mkErr(`already joined room ${ns}`);
			}

			if (!config) {
				throw mkErr("requires a config map as the first argument");
			}

			if (!ns) {
				throw mkErr("namespace argument required");
			}

			if (!config.appId) {
				throw mkErr("config map is missing appId field");
			}

			return await f(config, ns);
		};

export const selfId = genId(20);

export const noOp = () => {};

// export const iterate = async (
// 	peerMap: { [s: string]: ExtendedInstance },
// 	f: (id: string, peer: ExtendedInstance) => Promise<void>,
// 	targets?: string[] | string
// ) => {
// 	const ids = targets
// 		? (Array.isArray(targets)
// 				? targets
// 				: [targets])
// 		: Object.keys(peerMap);

// 	for (const id of ids) {
// 		const peer = peerMap[id];

// 		if (!peer) {
// 			console.warn(`${libName}: no peer with id ${id} found`);
// 			continue;
// 		}

// 		await f(id, peer);
// 	}
// };
