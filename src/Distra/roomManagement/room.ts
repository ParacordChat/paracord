import { SignalData } from "simple-peer";
import { events } from "../../helpers/consts/consts.js";
import {
	ExtendedInstance,
	Metadata,
	Room,
	TargetPeers
} from "../../helpers/types/distraTypes.js";
import {
	iterate,
	mkErr
} from "../../helpers/utils.js";
import { exitPeer } from "./exitPeer.js";
import { handleData } from "./handleData.js";
import { makeAction } from "./makeAction.js";
import { useHookStateManager } from "./state/hookState.js";
import { useRoomSignalManager } from "./state/roomSignalManager.js";
import { useRoomStateManager } from "./state/stateManager.js";

export default async (
	onPeer: (joinHook: (peer: ExtendedInstance, id: string) => void) => void,
	onSelfLeave: () => void
): Promise<Room> => {
	const [sendPing, getPing] = makeAction<null>("__91n6__", true);
	const [sendPong, getPong] = makeAction<null>("__90n6__", true);
	const [sendSignal, getSignal] = makeAction<any>("__516n4L__", true);
	const [sendStreamMeta, getStreamMeta] = makeAction<Metadata>(
		"__57r34m__",
		true
	);
	const [sendTrackMeta, getTrackMeta] = makeAction<Metadata>("__7r4ck__", true);

	onPeer((peer: ExtendedInstance, id: string) => {
		if (useRoomStateManager.getState().peerMap[id]) {
			return;
		}

		const onData = handleData.bind(null, id);

		useRoomStateManager.getState()
			.addToPeerMap(id, peer);

		peer.on(events.signal, (sdp) => sendSignal(sdp, id));
		peer.on(events.close, () => exitPeer(id));
		peer.on(events.data, onData);

		peer.on(events.stream, (stream) => {
			useHookStateManager.getState()
				.onPeerStream(stream, id, useRoomSignalManager.getState().pendingStreamMetas[id]);
			useRoomSignalManager.getState()
				.removeFromPendingStreamMetas(id);
		});

		peer.on(events.track, (track, stream) => {
			useHookStateManager.getState()
				.onPeerTrack(track, stream, id, useRoomSignalManager.getState().pendingTrackMetas[id]);
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
		peer.__drainEarlyData(onData);
	});

	getPing((_: any, id: string) => sendPong(null, id));

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

	getStreamMeta(
		(meta: any, id: string) => (useRoomSignalManager.getState()
			.addToPendingStreamMetas(id, meta))
	);

	getTrackMeta(
		(meta: any, id: string) => (useRoomSignalManager.getState()
			.addToPendingTrackMetas(id, meta))
	);

	return {
		makeAction,

		ping: async (id: string) => {
			if (!id) {
				throw mkErr("ping() must be called with target peer ID");
			}

			const start = Date.now();
			sendPing(null, id);
			await new Promise((res) => (useRoomSignalManager.getState()
				.addToPendingPongs(id, res)));
			return Date.now() - start;
		},

		leave: () => {
			for (const [id, peer] of Object.entries(useRoomStateManager.getState().peerMap)) {
				peer.destroy();
				useRoomStateManager.getState()
					.removeFromPeerMap(id);
			}
			onSelfLeave();
		},

		getPeers: () =>
			Object.fromEntries(
				Object.entries(useRoomStateManager.getState().peerMap)
					.map(([id, peer]) => [id, peer._pc])
			),

		addStream: (stream: MediaStream, targets?: TargetPeers, meta?: Metadata) => {
			const pmap = useRoomStateManager.getState().peerMap;
			const peerSendables = targets || Object.keys(pmap);
			const promises = [];

			for (const peerId of peerSendables) {
				const peer = pmap[peerId];
				if (meta) {
					promises.push(sendStreamMeta(meta, peerId));
				}
				promises.push(peer.addStream(stream));
			}

			return Promise.all(promises);
		},
		removeStream: (stream: MediaStream, targets: TargetPeers) => {
			const pmap = useRoomStateManager.getState().peerMap;
			const peerSendables = targets || Object.keys(pmap);
			peerSendables &&
        iterate(
        	pmap,
        	peerSendables,
        	(_, peer) =>
        		new Promise((res) => {
        			if(peer.streams.some((s) => s.id === stream.id)){
        				peer.removeStream(stream);
        			}
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
				? iterate(useRoomStateManager.getState().peerMap, targets, async (id, peer) => {
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
      	useRoomStateManager.getState().peerMap,
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
				? iterate(useRoomStateManager.getState().peerMap, targets, async (id, peer) => {
					if (meta) {
						await sendTrackMeta(meta, id);
					}

					peer.replaceTrack(oldTrack, newTrack, stream);
				})
				: [],

		onPeerJoin: (f: (peerId: string) => void) => (useHookStateManager.getState()
			.setOnPeerJoin(f)),

		onPeerLeave: (f: (peerId: string) => void) => (useHookStateManager.getState()
			.setOnPeerLeave(f)),

		onPeerError: (f: (peerId: string, error: any) => void) =>
			(useHookStateManager.getState()
				.setOnPeerError(f)),

		onPeerStream: (f: (arg0: any, arg1: string, arg2: any) => void) =>
			(useHookStateManager.getState()
				.setOnPeerStream(f)),

		onPeerTrack: (f: (arg0: any, arg1: any, arg2: string, arg3: any) => void) =>
			(useHookStateManager.getState()
				.setOnPeerTrack(f))
	};
};
