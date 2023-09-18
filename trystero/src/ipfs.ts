import ipfs, { IPFS } from "ipfs-core";
import { decrypt, encrypt, genKey } from "./crypto.js";
import room from "./room.js";
import {
  BaseRoomConfig,
  ExtendedInstance,
  IpfsRoomConfig,
  Room,
} from "./types.js";
import {
  decodeBytes,
  encodeBytes,
  events,
  initGuard,
  initPeer,
  libName,
  noOp,
  selfId,
} from "./utils.js";

const occupiedRooms = {};
const swarmPollMs = 999;
const announceMs = 3333;

const init = (config: IpfsRoomConfig) =>
  nodeP ||
  (nodeP = ipfs.create({
    repo: libName.toLowerCase() + Math.random(),
    EXPERIMENTAL: {
      ipnsPubsub: true,
    },
    config: {
      Addresses: {
        Swarm: config.swarmAddresses || [
          "/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star/",
          "/dns4/wrtc-star2.sjc.dwebops.pub/tcp/443/wss/p2p-webrtc-star/",
          "/dns4/webrtc-star.discovery.libp2p.io/tcp/443/wss/p2p-webrtc-star/",
        ],
      },
    },
  }));

let nodeP: Promise<IPFS>;

export const joinRoom = initGuard(
  occupiedRooms,
  (config: BaseRoomConfig & IpfsRoomConfig, ns: string | number) =>
    new Promise<Room>(async (resolve, reject) => {
      const rootTopic = `${libName.toLowerCase()}:${config.appId}:${ns}`;
      const selfTopic = `${rootTopic}:${selfId}`;
      const offers: { [x: string]: { signal: (arg0: any) => void } } = {};
      const seenPeers: { [x: string]: any } = {};
      const connectedPeers: { [x: string]: any } = {};
      const key = config.password && (await genKey(config.password, ns));

      const connectPeer = (peer: ExtendedInstance, peerId: string) => {
        onPeerConnect(peer, peerId);
        connectedPeers[peerId] = peer;
      };

      const disconnectPeer = (peerId: string) => {
        delete offers[peerId];
        delete seenPeers[peerId];
        delete connectedPeers[peerId];
      };

      let onPeerConnect: (
        peer: ExtendedInstance,
        id: string
      ) => void | (() => void) = noOp;
      let announceInterval: NodeJS.Timeout;
      let swarmPollTimeout: NodeJS.Timeout;

      const nodeP = init(config).then(async (node) => {
        const awaitPeers = async (cb: () => void) => {
          const peers = await node.swarm.peers();

          if (!peers || !peers.length) {
            swarmPollTimeout = setTimeout(awaitPeers, swarmPollMs, cb);
          } else {
            cb();
          }
        };

        await awaitPeers;
        await Promise.all([
          node.pubsub.subscribe(rootTopic, (msg) => {
            const peerId = decodeBytes(msg.data);

            if (
              peerId === selfId ||
              connectedPeers[peerId] ||
              seenPeers[peerId]
            ) {
              return;
            }

            seenPeers[peerId] = true;

            const peer = (offers[peerId] = initPeer(
              true,
              false,
              config.rtcConfig
            ));

            peer.once(events.signal, async (offer: { sdp: string }) => {
              node.pubsub.publish(
                `${rootTopic}:${peerId}`,
                encodeBytes(
                  JSON.stringify({
                    peerId: selfId,
                    offer: key
                      ? { ...offer, sdp: await encrypt(key, offer.sdp) }
                      : offer,
                  })
                )
              );

              setTimeout(() => {
                if (connectedPeers[peerId]) {
                  return;
                }

                delete seenPeers[peerId];
                peer.destroy();
              }, announceMs * 2);
            });

            peer.once(events.connect, () => connectPeer(peer, peerId));
            peer.once(events.close, () => disconnectPeer(peerId));
          }),

          node.pubsub.subscribe(selfTopic, async (msg) => {
            let payload;

            try {
              payload = JSON.parse(decodeBytes(msg.data));
            } catch (e) {
              console.error(`${libName}: received malformed JSON`);
              return;
            }

            const { peerId, offer, answer } = payload;

            if (offers[peerId] && answer) {
              offers[peerId].signal(
                key
                  ? { ...answer, sdp: await decrypt(key, answer.sdp) }
                  : answer
              );
              return;
            }

            const peer = initPeer(false, false, config.rtcConfig);

            peer.once(events.signal, async (answer: { sdp: string }) =>
              node.pubsub.publish(
                `${rootTopic}:${peerId}`,
                encodeBytes(
                  JSON.stringify({
                    peerId: selfId,
                    answer: key
                      ? { ...answer, sdp: await encrypt(key, answer.sdp) }
                      : answer,
                  })
                )
              )
            );
            peer.once(events.connect, () => connectPeer(peer, peerId));
            peer.once(events.close, () => disconnectPeer(peerId));
            peer.signal(
              key ? { ...offer, sdp: await decrypt(key, offer.sdp) } : offer
            );
          }),
        ]);

        const announce = () =>
          node.pubsub.publish(rootTopic, encodeBytes(selfId));
        announceInterval = setInterval(announce, announceMs);
        announce();

        return node;
      });

      try {
        const retRoom = await room(
          (f) => (onPeerConnect = f),
          async () => {
            const node = await nodeP;
            node.pubsub.unsubscribe(rootTopic, (m) => console.log(m));
            node.pubsub.unsubscribe(selfTopic, (m) => console.log(m));
            clearInterval(announceInterval);
            clearTimeout(swarmPollTimeout);
          },
          config.encryptDecrypt
        );
        return resolve(retRoom);
      } catch (e) {
        return reject(e);
      }
    })
);

export { selfId } from "./utils.js";
