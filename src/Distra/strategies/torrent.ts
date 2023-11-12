/* eslint-disable max-lines-per-function */
import { events, libName } from "../../helpers/consts/consts.js";
import { decrypt, encrypt, genKey } from "../../helpers/cryptography/crypto.js";
import { encodeBytes } from "../../helpers/dataHandling/uint8util.js";
import {
	ExtendedInstance,
	TorrentRoomConfig
} from "../../helpers/types/distraTypes.js";
import {
	genId,
	initGuard,
	initPeer,
	noOp,
	selfId
} from "../../helpers/utils.js";
import room from "../roomManagement/room.js";

const occupiedRooms: { [x: string]: any } = {};
const sockets: { [x: string]: any } = {};
const socketListeners: { [x: string]: { [x: string]: any } } = {};
const hashLimit = 20;
const offerPoolSize = 10;
const defaultRedundancy = 2;
const defaultAnnounceSecs = 33;
const maxAnnounceSecs = 120;
const trackerAction = "announce";
const defaultTrackerUrls = [
	"wss://fediverse.tv/tracker/socket",
	"wss://tracker.files.fm:7073/announce",
	"wss://tracker.openwebtorrent.com",
	"wss://tracker.btorrent.xyz",
	"wss://qot.abiir.top:443/announce",
	"wss://spacetradersapi-chatbox.herokuapp.com:443/announce"
];

export const joinRoom = initGuard(
	occupiedRooms,
	async (config: TorrentRoomConfig, ns: string | number) => {
		const connectedPeers: { [x: string]: any } = {};
		const key = config.password && (await genKey(config.password, ns));
		const trackerUrls = (config.trackerUrls || defaultTrackerUrls).slice(
			0,
			config.trackerUrls
				? config.trackerUrls.length
				: config.trackerRedundancy || defaultRedundancy
		);

		if (trackerUrls.length === 0) {
			throw new Error("trackerUrls is empty");
		}

		const infoHashP = crypto.subtle // await is lower down
			.digest("SHA-1", encodeBytes(`${libName}:${config.appId}:${ns}`))
			.then((buffer) =>
				[...new Uint8Array(buffer)]
					.map((b) => b.toString(36))
					.join("")
					.slice(0, hashLimit)
			);

		const makeOffers = (howMany: number) =>
			Object.fromEntries(
				Array.from({ length: howMany })
					.fill("")
					.map(() => {
						const peer = initPeer(true, false, config.rtcConfig);

						return [
							genId(hashLimit),
							{
								peer,
								offerP: new Promise<RTCSessionDescription>((res) =>
									peer.once(events.signal, res)
								)
							}
						];
					})
			);

		const makeOfferPool = () => makeOffers(offerPoolSize);

		const onSocketMessage = async (socket: WebSocket, e: { data: string }) => {
			const infoHash = await infoHashP;
			let val: {
        [x: string]: any;
        info_hash: string;
        peer_id: string;
        interval: number;
        offer: { sdp: string };
        offer_id: string | number;
        answer: { sdp: string };
      };

			try {
				val = JSON.parse(e.data);
			} catch {
				console.error(`${libName}: received malformed SDP JSON`);
				return;
			}

			if (
				val.info_hash !== infoHash ||
        (val.peer_id && val.peer_id === selfId)
			) {
				return;
			}

			const failure = val["failure reason"];

			if (failure) {
				console.warn(`${libName}: torrent tracker failure (${failure})`);
				return;
			}

			if (
				val.interval &&
        val.interval > announceSecs &&
        val.interval <= maxAnnounceSecs
			) {
				clearInterval(announceInterval);
				announceSecs = val.interval;
				announceInterval = setInterval(announceAll, announceSecs * 1000);
			}

			if (val.offer && val.offer_id) {
				if (connectedPeers[val.peer_id] || handledOffers[val.offer_id]) {
					return;
				}

				handledOffers[val.offer_id] = true;

				const peer = initPeer(false, false, config.rtcConfig);

				peer.once(events.signal, async (answer) =>
					socket.send(
						JSON.stringify({
							answer: key
								? { ...answer, sdp: await encrypt(key, answer.sdp) }
								: answer,
							action: trackerAction,
							info_hash: infoHash,
							peer_id: selfId,
							to_peer_id: val.peer_id,
							offer_id: val.offer_id
						})
					)
				);
				peer.on(events.connect, () =>
					onConnect(peer, val.peer_id, `${val.offer_id}`)
				);
				peer.on(events.close, () =>
					onDisconnect(peer, val.peer_id, `${val.offer_id}`)
				);
				peer.signal(
					key
						? {
								...val.offer,
								sdp: await decrypt(key, JSON.parse(val.offer.sdp)),
								type: "offer"
							}
						: { ...val.offer, type: "offer" }
				);

				return;
			}

			if (val.answer) {
				if (connectedPeers[val.peer_id] || handledOffers[val.offer_id]) {
					return;
				}

				const offer = offerPool[val.offer_id];

				if (offer) {
					const { peer } = offer;

					if (peer.destroyed) {
						return;
					}

					handledOffers[val.offer_id] = true;
					peer.on(events.connect, () =>
						onConnect(peer, val.peer_id, `${val.offer_id}`)
					);
					peer.on(events.close, () =>
						onDisconnect(peer, val.peer_id, `${val.offer_id}`)
					);
					peer.signal(
						key
							? {
									...val.answer,
									sdp: await decrypt(key, JSON.parse(val.answer.sdp)),
									type: "answer"
								}
							: { ...val.answer, type: "answer" }
					);
				}
			}
		};

		const announce = async (socket: WebSocket, infoHash: string) =>
			socket.send(
				JSON.stringify({
					action: trackerAction,
					info_hash: infoHash,
					numwant: offerPoolSize,
					peer_id: selfId,
					offers: await Promise.all(
						Object.entries(offerPool)
							.map(async ([id, { offerP }]) => {
								const offer = await offerP;

								return {
									offer_id: id,
									offer: key
										? { ...offer, sdp: await encrypt(key, offer.sdp) }
										: offer
								};
							})
					)
				})
			);

		const makeSocket = (
			url: string,
			infoHash: string,
			forced: boolean = false
		) => {
			if (forced || !sockets[url]) {
				socketListeners[url] = {
					...socketListeners[url],
					[infoHash]: onSocketMessage
				};
				sockets[url] = new Promise((res) => {
					const socket = new WebSocket(url);
					socket.addEventListener("open", res.bind(null, socket));
					socket.addEventListener("error", console.error);
					socket.addEventListener("message", (err) => {
						for (const f of Object.values(socketListeners[url])) f(socket, err);
					});
				});
			} else {
				socketListeners[url][infoHash] = onSocketMessage;
			}

			return sockets[url];
		};

		const announceAll = async () => {
			const infoHash = await infoHashP;

			if (offerPool) {
				cleanPool();
			}

			offerPool = makeOfferPool();

			trackerUrls.forEach(async (url) => {
				const socket = await makeSocket(url, infoHash);

				if (socket.readyState === WebSocket.OPEN) {
					announce(socket, infoHash);
				} else if (socket.readyState !== WebSocket.CONNECTING) {
					announce(await makeSocket(url, infoHash, true), infoHash);
				}
			});
		};

		const cleanPool = () => {
			for (const [id, { peer }] of Object.entries(offerPool)) {
				if (!handledOffers[id] && !connectedPeers[id]) {
					peer.destroy();
				}
			}

			handledOffers = {};
		};

		const onConnect = (peer: ExtendedInstance, id: string, offerId: string) => {
			onPeerConnect(peer, id);
			connectedPeers[id] = true;

			if (offerId) {
				connectedPeers[offerId] = true;
			}
		};

		const onDisconnect = (
			peer: ExtendedInstance,
			peerId: string,
			offerId: string
		) => {
			delete connectedPeers[peerId];
			peer.destroy();

			const isInOfferPool = offerId in offerPool;

			if (isInOfferPool) {
				delete offerPool[offerId];
				offerPool = { ...offerPool, ...makeOffers(1) };
			}
		};

		let announceSecs = defaultAnnounceSecs;
		let announceInterval = setInterval(announceAll, announceSecs * 1000);
		let onPeerConnect: (
      peer: ExtendedInstance,
      id: string
    ) => void | (() => void) = noOp;
		let handledOffers: { [x: string]: any } = {};
		let offerPool: {
      [s: string]: {
        peer: ExtendedInstance;
        offerP: Promise<RTCSessionDescription>;
      };
    };

		occupiedRooms[ns] = true;
		announceAll();

		return await room(
			(f) => {
				onPeerConnect = f;
			},
			async () => {
				const infoHash = await infoHashP;

				for (const url of trackerUrls) delete socketListeners[url][infoHash];
				delete occupiedRooms[ns];
				clearInterval(announceInterval);
				cleanPool();
			}
		);
	}
);
