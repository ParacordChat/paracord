import { initializeApp } from "firebase/app";
import {
	child,
	Database,
	getDatabase,
	off,
	onChildAdded,
	onDisconnect,
	onValue,
	push,
	ref,
	remove,
	set,
	Unsubscribe
} from "firebase/database";
import { decrypt, encrypt, genKey } from "../../helpers/cryptography/crypto.js";
import {
	ExtendedInstance,
	FirebaseRoomConfig
} from "../../helpers/types/distraTypes.js";
import {
	firebaseGuard,
	initGuard,
	initPeer,
	noOp,
	selfId
} from "../../helpers/utils.js";
import room from "../roomManagement/room.js";
import { events, libName } from "../../helpers/consts/consts.js";

const presencePath = "_";
const defaultRootPath = `__${libName.toLowerCase()}__`;
const occupiedRooms: { [x: string]: any } = {};
const dbs: { [x: string]: Database } = {};
const getPath = (...xs: string[]) => xs.join("/");
const normalizeDbUrl = (url: string) =>
	url.startsWith("https://") ? url : `https://${url}.firebaseio.com`;

const init = (config: FirebaseRoomConfig): Database => {
	if (config.firebaseApp) {
		const url = config.firebaseApp.options.databaseURL;
		if (url) {
			if (dbs[url]) {
				return dbs[url];
			} else {
				const db = getDatabase(config.firebaseApp);
				dbs[url] = db;
				return db;
			}
		}
	}

	const url = normalizeDbUrl(config.appId);
	if (dbs[url]) {
		return dbs[url];
	} else {
		const db = getDatabase(initializeApp({ databaseURL: url }));
		dbs[url] = db;
		return db;
	}
};

export const joinRoom = initGuard(
	occupiedRooms,
	async (config: FirebaseRoomConfig, ns: string | number) => {
		const db = init(config);
		if (!db) throw new Error("No database!");
		const peerMap: { [x: string]: any } = {};
		const peerSigs: { [x: string]: { [x: string]: boolean } } = {};
		const connectedPeers: { [peerId: string]: boolean } = {};
		const rootPath = config.rootPath || defaultRootPath;
		const roomRef = ref(db, getPath(rootPath, `${ns}`));
		const selfRef = child(roomRef, selfId);
		const cryptoKey = config.password && (await genKey(config.password, ns));
		const unsubFns: Unsubscribe[] = [];

		const makePeer = (id: string, initiator: boolean) => {
			if (peerMap[id] && !peerMap[id].destroyed) {
				return peerMap[id];
			}

			const peer = initPeer(initiator, true, config.rtcConfig);

			peer.once(events.connect, () => {
				onPeerConnect(peer, id);
				connectedPeers[id] = true;
			});

			peer.on(events.signal, async (sdp: Object) => {
				if (connectedPeers[id]) {
					return;
				}

				const payload = JSON.stringify(sdp);
				const signalRef = push(ref(db, getPath(rootPath, `${ns}`, id, selfId)));

				onDisconnect(signalRef)
					.remove();
				set(signalRef, cryptoKey ? await encrypt(cryptoKey, payload) : payload);
			});

			peer.once(events.close, () => {
				delete peerMap[id];
				delete peerSigs[id];
				delete connectedPeers[id];
			});

			peerMap[id] = peer;
			return peer;
		};

		let didSyncRoom = false;
		let onPeerConnect: (
      peer: ExtendedInstance,
      id: string
    ) => void | (() => void) = noOp;

		occupiedRooms[ns] = true;

		set(selfRef, { [presencePath]: true });
		onDisconnect(selfRef)
			.remove();
		onChildAdded(selfRef, (data) => {
			const peerId = data.key;

			if (!peerId || peerId === presencePath || connectedPeers[peerId]) {
				return;
			}

			unsubFns.push(
				onChildAdded(data.ref, async (data) => {
					if (!(peerId in peerSigs)) {
						peerSigs[peerId] = {};
					}

					if (data.key) {
						if (data.key in peerSigs[peerId]) {
							return;
						}

						peerSigs[peerId][data.key] = true;

						let val;

						try {
							val = JSON.parse(
								cryptoKey ? await decrypt(cryptoKey, data.val()) : data.val()
							);
						} catch {
							console.error(`${libName}: received malformed SDP JSON`);
							return;
						}

						const peer = makePeer(peerId, false);

						peer.signal(val);
						remove(data.ref);
					}
				})
			);
		});

		onValue(roomRef, () => (didSyncRoom = true), { onlyOnce: true });
		onChildAdded(roomRef, ({ key }) => {
			if (!didSyncRoom || key === selfId || !key) {
				return;
			}
			makePeer(key, true);
		});

		return await room(
			(f) => (onPeerConnect = f),
			() => {
				off(selfRef);
				remove(selfRef);
				off(roomRef);
				for (const f of unsubFns) f();
				delete occupiedRooms[ns];
			}
		);
	}
);

export const getOccupants = firebaseGuard(
	occupiedRooms,
	(config: FirebaseRoomConfig, ns: string | number): Promise<string[]> =>
		new Promise((res) =>
			onValue(
				ref(init(config), getPath(config.rootPath || defaultRootPath, `${ns}`)),
				(data) => res(Object.keys(data.val() || {})),
				{ onlyOnce: true }
			)
		)
);

export { selfId } from "../../helpers/utils.js";
