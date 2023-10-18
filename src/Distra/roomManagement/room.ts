/* eslint-disable max-lines-per-function */
// TODO: codesplit this file
import { SignalData } from "simple-peer";
import {
	EncryptDecryptObj,
	ExtendedInstance,
	Metadata,
	Room,
	TargetPeers
} from "../helpers/types.js";
import {
	entries,
	events,
	fromEntries,
	iterate,
	keys,
	mkErr
} from "../helpers/utils.js";
import { buildExitPeer } from "./exitPeer.js";
import { buildHandleData } from "./handleData.js";
import { buildMakeAction } from "./makeAction.js";
import { RoomStateManager } from "./stateManager.js";

export default async (
	onPeer: (joinHook: (peer: ExtendedInstance, id: string) => void) => void,
	onSelfLeave: () => void,
	encryptDecrypt?: EncryptDecryptObj
): Promise<Room> => {
	const roomState = new RoomStateManager();

	const exitPeer = buildExitPeer(roomState);

	const makeAction = buildMakeAction(roomState, encryptDecrypt);

	const handleData = buildHandleData(roomState, encryptDecrypt);
	// 	try {
	// 		const buffer = await (async () => {
	// 			const payloadRaw = new Uint8Array(data);
	// 			if (encryptDecrypt && encryptDecrypt?.ecPeerlist()
	// 				.includes(id)) {
	// 				const dec = await encryptDecrypt
	// 					.decrypt(id, payloadRaw)
	// 					.catch((error) => {
	// 						throw console.error(error);
	// 					});
	// 				return JSON.parse(decodeBytes(dec));
	// 			} else {
	// 				return JSON.parse(decodeBytes(payloadRaw));
	// 			}
	// 		})();

	// 		const {
	// 			typeBytes,
	// 			nonce,
	// 			isLast,
	// 			isMeta,
	// 			isBinary,
	// 			isJson,
	// 			progress,
	// 			payload: plenc
	// 		} = buffer;
	// 		const payload = base64ToBytes(plenc);

	// 		if (!actions[typeBytes]) {
	// 			throw mkErr(`received message with unregistered type (${typeBytes})`);
	// 		}

	// 		if (!pendingTransmissions[id]) {
	// 			pendingTransmissions[id] = {};
	// 		}

	// 		if (!pendingTransmissions[id][typeBytes]) {
	// 			pendingTransmissions[id][typeBytes] = {};
	// 		}

	// 		let target = pendingTransmissions[id][typeBytes][nonce];

	// 		if (!target) {
	// 			target = pendingTransmissions[id][typeBytes][nonce] = { chunks: [] };
	// 		}

	// 		if (isMeta) {
	// 			target.meta = JSON.parse(decodeBytes(payload));
	// 		} else {
	// 			target.chunks.push(payload);
	// 		}

	// 		actions[typeBytes].onProgress(progress / oneByteMax, id, target.meta);

	// 		if (!isLast) {
	// 			return;
	// 		}

	// 		const full = combineChunks(target.chunks);

	// 		if (isBinary) {
	// 			actions[typeBytes].onComplete(full, id, target.meta);
	// 		} else {
	// 			const text = decodeBytes(full);
	// 			actions[typeBytes].onComplete(isJson ? JSON.parse(text) : text, id);
	// 		}

	// 		delete pendingTransmissions[id][typeBytes][nonce];
	// 	} catch (error) {
	// 		console.error(error);
	// 	}
	// };

	const [sendPing, getPing] = makeAction<null>("__91n6__", true);
	const [sendPong, getPong] = makeAction<null>("__90n6__", true);
	const [sendSignal, getSignal] = makeAction<any>("__516n4L__", true);
	const [sendStreamMeta, getStreamMeta] = makeAction<Metadata>(
		"__57r34m__",
		true
	);
	const [sendTrackMeta, getTrackMeta] = makeAction<Metadata>("__7r4ck__", true);

	onPeer((peer: ExtendedInstance, id: string) => {
		if (roomState.peerMap[id]) {
			return;
		}

		const onData = handleData.bind(null, id);

		roomState.peerMap[id] = peer;

		peer.on(events.signal, (sdp) => sendSignal(sdp, id));
		peer.on(events.close, () => exitPeer(id));
		peer.on(events.data, onData);

		peer.on(events.stream, (stream) => {
			roomState.onPeerStream(stream, id, roomState.pendingStreamMetas[id]);
			delete roomState.pendingStreamMetas[id];
		});

		peer.on(events.track, (track, stream) => {
			roomState.onPeerTrack(track, stream, id, roomState.pendingTrackMetas[id]);
			delete roomState.pendingTrackMetas[id];
		});

		peer.on(events.error, (e) => {
			roomState.onPeerError(id, e);
			exitPeer(id);
			if (e.code === "ERR_DATA_CHANNEL") {
				return;
			}
			console.error(e);
		});

		roomState.onPeerJoin(id);
		peer.__drainEarlyData(onData);
	});

	getPing((_: any, id: string) => sendPong(null, id));

	getPong((_: any, id: string) => {
		if (roomState.pendingPongs[id]) {
			roomState.pendingPongs[id]();
			delete roomState.pendingPongs[id];
		}
	});

	getSignal((sdp: SignalData | string, id: string) => {
		if (roomState.peerMap[id]) {
			roomState.peerMap[id].signal(sdp);
		}
	});

	getStreamMeta(
		(meta: any, id: string) => (roomState.pendingStreamMetas[id] = meta)
	);

	getTrackMeta(
		(meta: any, id: string) => (roomState.pendingTrackMetas[id] = meta)
	);

	return {
		makeAction,

		ping: async (id: string) => {
			if (!id) {
				throw mkErr("ping() must be called with target peer ID");
			}

			const start = Date.now();
			sendPing(null, id);
			await new Promise((res) => (roomState.pendingPongs[id] = res));
			return Date.now() - start;
		},

		leave: () => {
			for (const [id, peer] of entries(roomState.peerMap)) {
				peer.destroy();
				delete roomState.peerMap[id];
			}
			onSelfLeave();
		},

		getPeers: () =>
			fromEntries(
				entries(roomState.peerMap)
					.map(([id, peer]) => [id, peer._pc])
			),

		addStream: (stream: MediaStream, targets: TargetPeers, meta: Metadata) => {
			const peerSendables = targets || keys(roomState.peerMap);
			if (!peerSendables) return [];
			return iterate(roomState.peerMap, peerSendables, async (id, peer) => {
				if (meta) {
					await sendStreamMeta(meta, id);
				}
				peer.addStream(stream);
			});
		},
		removeStream: (stream: MediaStream, targets: TargetPeers) => {
			const peerSendables = targets || keys(roomState.peerMap);
			peerSendables &&
				iterate(
					roomState.peerMap,
					peerSendables,
					(_, peer) =>
						new Promise((res) => {
							peer.removeStream(stream);
							res();
						})
				);
		},

		addTrack: (
			track: MediaStreamTrack,
			stream: MediaStream,
			targets: TargetPeers,
			meta: Metadata
		) =>
			targets
				? iterate(roomState.peerMap, targets, async (id, peer) => {
					if (meta) {
						await sendTrackMeta(meta, id);
					}

					peer.addTrack(track, stream);
				  })
				: [],

		removeTrack: (
			track: MediaStreamTrack,
			stream: MediaStream,
			targets: TargetPeers
		) =>
			targets &&
			iterate(
				roomState.peerMap,
				targets,
				(_, peer) =>
					new Promise((res) => {
						peer.removeTrack(track, stream);
						res();
					})
			),
		replaceTrack: (
			oldTrack: MediaStreamTrack,
			newTrack: MediaStreamTrack,
			stream: MediaStream,
			targets: TargetPeers,
			meta: Metadata
		) =>
			targets
				? iterate(roomState.peerMap, targets, async (id, peer) => {
					if (meta) {
						await sendTrackMeta(meta, id);
					}

					peer.replaceTrack(oldTrack, newTrack, stream);
				  })
				: [],

		onPeerJoin: (f: (peerId: string) => void) => (roomState.onPeerJoin = f),

		onPeerLeave: (f: (peerId: string) => void) => (roomState.onPeerLeave = f),

		onPeerError: (f: (peerId: string, error: any) => void) =>
			(roomState.onPeerError = f),

		onPeerStream: (f: (arg0: any, arg1: string, arg2: any) => void) =>
			(roomState.onPeerStream = f),

		onPeerTrack: (f: (arg0: any, arg1: any, arg2: string, arg3: any) => void) =>
			(roomState.onPeerTrack = f)
	};
};
