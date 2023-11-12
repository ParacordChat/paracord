/* eslint-disable max-lines-per-function */ // TODO: fixme
import { SignalData } from "simple-peer";
import { events, oneByteMax } from "../../helpers/consts/consts.js";
import { decryptData } from "../../helpers/cryptography/cryptoSuite.js";
import { base64ToBytes } from "../../helpers/dataHandling/b64util.js";
import { decodeBytes } from "../../helpers/dataHandling/uint8util.js";
import {
	ExtendedInstance,
	Room,
	StrictMetadata,
	TargetPeers
} from "../../helpers/types/distraTypes";
import { User } from "../../helpers/types/types.js";
import { mkErr } from "../../helpers/utils";
import { useUserStore } from "../../stateManagers/userManagers/userStore.js";
import { exitPeer } from "./exitPeer";
import { makeAction } from "./makeAction";
import { useHookStateManager } from "./state/hookState";
import { useRoomSignalManager } from "./state/roomSignalManager";
import { useRoomStateManager } from "./state/stateManager";

export default async (
	onPeer: (joinHook: (peer: ExtendedInstance, id: string) => void) => void,
	onSelfLeave: () => void
): Promise<Room> => {
	const [sendPing, getPing] = makeAction<null>("__91n6__", true);
	const [sendPong, getPong] = makeAction<null>("__90n6__", true);
	const [sendSignal, getSignal] = makeAction<any>("__516n4L__", true);
	const [sendStreamMeta, getStreamMeta] = makeAction<StrictMetadata>(
		"__57r34m__",
		true
	);
	const [sendTrackMeta, getTrackMeta] = makeAction<StrictMetadata>(
		"__7r4ck__",
		true
	);

	onPeer((peer: ExtendedInstance, id: string) => {
		if (useRoomStateManager.getState().peerMap[id]) {
			return;
		}

		useRoomStateManager.getState()
			.addToPeerMap(id, peer);

		const cachedDecryptKeys: { [key: string]: Uint8Array } = {};
		const pendingTransmissions: { [key: string]: any } = {};

		const handleData = (id: string, data: any) => {
			const {
				typeBytes,
				uuid,
				isLast,
				isMeta,
				isBinary,
				isJson,
				progress,
				payload: plenc
			} = data;
			const payload = base64ToBytes(plenc);

			const actions = useRoomStateManager.getState().actions[typeBytes];

			if (!actions) {
				throw mkErr(`received message with unregistered type (${typeBytes})`);
			}

			const target =
        pendingTransmissions[uuid] ||
        (pendingTransmissions[uuid] = {
        	chunks: new Uint8Array(),
        	meta: undefined
        });

			if (isMeta) {
				target.meta = JSON.parse(decodeBytes(payload));
			} else {
				target.chunks = new Uint8Array([...target.chunks, ...payload]);
			}

			actions.onProgress(progress / oneByteMax, id, target.meta);

			if (isLast) {
				if (isBinary) {
					actions.onComplete(target.chunks, id, target.meta);
				} else {
					const text = decodeBytes(target.chunks);
					actions.onComplete(isJson ? JSON.parse(text) : text, id);
				}

				delete pendingTransmissions[uuid];
			}
		};

		peer.on(events.signal, (sdp) => sendSignal(sdp, [id]));
		peer.on(events.close, () => exitPeer(id));
		peer.on(events.data, (data) => {
			const payloadRaw = new Uint8Array(data);

			try {
				const decKey = cachedDecryptKeys[id];
				if (!decKey) throw mkErr("");
				return decryptData(payloadRaw, decKey)
					.then((dec) => handleData(id, JSON.parse(decodeBytes(dec))))
					.catch((error) => console.error(error));
			} catch {
				const decryptKey = useUserStore
					.getState()
					.users.find((user: User) => user.id === id)?.quantumRecv;
				if (decryptKey) {
					cachedDecryptKeys[id] = decryptKey;
					decryptData(payloadRaw, decryptKey)
						.then((dec) => handleData(id, JSON.parse(decodeBytes(dec))))
						.catch((error) => console.error(error));
				} else {
					handleData(id, JSON.parse(decodeBytes(payloadRaw)));
				}
			}
		});

		peer.on(events.stream, (stream) => {
			useHookStateManager
				.getState()
				.onPeerStream(
					stream,
					id,
					useRoomSignalManager.getState().pendingStreamMetas[id]
				);
			useRoomSignalManager.getState()
				.removeFromPendingStreamMetas(id);
		});

		peer.on(events.track, (track, stream) => {
			useHookStateManager
				.getState()
				.onPeerTrack(
					track,
					stream,
					id,
					useRoomSignalManager.getState().pendingTrackMetas[id]
				);
			useRoomSignalManager.getState()
				.removeFromPendingTrackMetas(id);
		});

		peer.on(events.error, (e) => {
			useHookStateManager.getState()
				.onPeerError(id, e);
			exitPeer(id);
			if (e.code === "ERR_DATA_CHANNEL") {
				return;
			}
			console.error(e);
		});

		useHookStateManager.getState()
			.onPeerJoin(id);
	});

	getPing((_: any, id: string) => sendPong(null, [id]));

	getPong((_: any, id: string) => {
		const pongPending = useRoomSignalManager.getState().pendingPongs[id];
		if (pongPending) {
			pongPending();
			useRoomSignalManager.getState()
				.removeFromPendingPongs(id);
		}
	});

	getSignal((sdp: SignalData | string, id: string) => {
		const peerSig = useRoomStateManager.getState().peerMap[id];
		if (peerSig) {
			peerSig.signal(sdp);
		}
	});

	getStreamMeta((meta: any, id: string) =>
		useRoomSignalManager.getState()
			.addToPendingStreamMetas(id, meta)
	);

	getTrackMeta((meta: any, id: string) =>
		useRoomSignalManager.getState()
			.addToPendingTrackMetas(id, meta)
	);

	return {
		makeAction,

		ping: async (id: string) => {
			if (!id) {
				throw mkErr("ping() must be called with target peer ID");
			}

			const start = Date.now();
			sendPing(null, [id]);
			await new Promise((res) =>
				useRoomSignalManager.getState()
					.addToPendingPongs(id, res)
			);
			return Date.now() - start;
		},

		leave: () => {
			for (const [id, peer] of Object.entries(
				useRoomStateManager.getState().peerMap
			)) {
				peer.destroy();
				useRoomStateManager.getState()
					.removeFromPeerMap(id);
			}
			onSelfLeave();
		},

		getPeers: () =>
			Object.fromEntries(
				Object.entries(useRoomStateManager.getState().peerMap)
					.map(
						([id, peer]) => [id, peer._pc]
					)
			),

		addStream: (
			stream: MediaStream,
			targets?: TargetPeers,
			meta?: StrictMetadata
		) => {
			const pmap = useRoomStateManager.getState().peerMap;
			const peerSendables = targets || Object.keys(pmap);
			const promises = [];

			for (const peerId of peerSendables) {
				const peer = pmap[peerId];
				if (meta) {
					promises.push(sendStreamMeta(meta, [peerId]));
				}
				promises.push(peer.addStream(stream));
			}

			return Promise.all(promises);
		},
		removeStream: (stream: MediaStream, targets: TargetPeers) => {
			const pmap = useRoomStateManager.getState().peerMap;
			const peerSendables = targets || Object.keys(pmap);
			for (const peerId of peerSendables) {
				const peer = pmap[peerId];
				if (peer.streams.some((s) => s.id === stream.id)) {
					peer.removeStream(stream);
				}
			}
		},

		addTrack: (
			track: MediaStreamTrack,
			stream: MediaStream,
			targets?: TargetPeers,
			meta?: StrictMetadata
		) => {
			if (targets) {
				return Promise.all(
					Object.entries(useRoomStateManager.getState().peerMap)
						.filter(([id]) => targets.includes(id))
						.map(async ([id, peer]) => {
							if (meta) {
								await sendTrackMeta(meta, [id]);
							}

							peer.addTrack(track, stream);
						})
				);
			}
		},
		removeTrack: (
			track: MediaStreamTrack,
			stream: MediaStream,
			targets: TargetPeers
		) => {
			if (targets) {
				const tgs = typeof targets === "string" ? [targets] : targets;
				return tgs.forEach((peerId) => {
					const peer = useRoomStateManager.getState().peerMap[peerId];
					if (peer) {
						peer.removeTrack(track, stream);
					}
				});
			}
		}, // TODO: replacestream function?
		replaceTrack: (
			oldTrack: MediaStreamTrack,
			newTrack: MediaStreamTrack,
			stream: MediaStream,
			targets?: TargetPeers,
			meta?: StrictMetadata
		) => {
			if (targets) {
				return Promise.all(
					Object.entries(useRoomStateManager.getState().peerMap)
						.filter(([id]) => targets.includes(id))
						.map(async ([id, peer]) => {
							if (meta) {
								await sendTrackMeta(meta, [id]);
							}

							peer.replaceTrack(oldTrack, newTrack, stream);
						})
				);
			}
		},

		onPeerJoin: (f: (peerId: string) => void) =>
			useHookStateManager.getState()
				.setOnPeerJoin(f),

		onPeerLeave: (f: (peerId: string) => void) =>
			useHookStateManager.getState()
				.setOnPeerLeave(f),

		onPeerError: (f: (peerId: string, error: any) => void) =>
			useHookStateManager.getState()
				.setOnPeerError(f),

		onPeerStream: (f: (arg0: any, arg1: string, arg2: any) => void) =>
			useHookStateManager.getState()
				.setOnPeerStream(f),

		onPeerTrack: (f: (arg0: any, arg1: any, arg2: string, arg3: any) => void) =>
			useHookStateManager.getState()
				.setOnPeerTrack(f)
	};
};
