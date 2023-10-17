/* eslint-disable no-underscore-dangle */
// @ts-ignore
import Peer from "simple-peer-light";
import { FirebaseRoomConfig, TorrentRoomConfig } from "..";
import { ExtendedInstance, Room } from "./types";

const charSet =
	"0123456789AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz";

export const libName = "Distra";

export const { keys, values, entries, fromEntries } = Object;

export const events = fromEntries(
	["close", "connect", "data", "error", "signal", "stream", "track"].map(
		(k) => [k, k]
	)
);

export const initPeer = (
	initiator: boolean,
	trickle: boolean,
	config: RTCConfiguration | undefined
) => {
	const peer: ExtendedInstance = new Peer({
		initiator,
		trickle,
		config
	}) as ExtendedInstance;
	const onData = (data: any) => peer.__earlyDataBuffer.push(data); // TODO: find a more standard way to do this, without the inherited simplepeer hacks

	peer.on(events.data, onData);
	peer.__earlyDataBuffer = [];
	peer.__drainEarlyData = (f: any) => {
		peer.off(events.data, onData);
		peer.__earlyDataBuffer.forEach(f);
		delete peer.__earlyDataBuffer;
		peer.__drainEarlyData = noOp;
	};

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

			// if (!config.appId) {
			//   throw mkErr("config map is missing appId field");
			// }

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

export const encodeBytes = (txt: string | undefined) =>
	new TextEncoder()
		.encode(txt);

export const decodeBytes = (txt: any | undefined) =>
	new TextDecoder()
		.decode(txt);

export const combineChunks = (chunks: any[]) => {
	const full = new Uint8Array(
		chunks.reduce((a: any, c: { byteLength: any }) => a + c.byteLength, 0)
	);

	for (let i = 0, l = chunks.length, c = 0; i < l; i++) {
		full.set(chunks[i], c);
		c += chunks[i].byteLength;
	}

	// chunks.reduce((a: number | undefined, c) => {
	// 	full.set(c, a);
	// 	return a + c.byteLength;
	// }, 0);

	return full;
};

export const iterate = (
	peerMap: { [s: string]: ExtendedInstance },
	targets: string[] | string,
	f: (id: string, peer: ExtendedInstance) => Promise<void>
) =>
	(targets
		? (Array.isArray(targets)
				? targets
				: [targets])
		: keys(peerMap)
	).flatMap((id) => {
		const peer = peerMap[id];

		if (!peer) {
			console.warn(`${libName}: no peer with id ${id} found`);
			return [];
		}

		return f(id, peer);
	});
