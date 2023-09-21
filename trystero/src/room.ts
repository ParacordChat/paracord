/* eslint-disable max-lines-per-function */
// TODO: codesplit this file
import { SignalData } from "simple-peer";
import streamSaver from "streamsaver";
import {
	ActionSender,
	ExtendedInstance,
	MakeAction,
	Metadata,
	Room,
	TargetPeers
} from "./types.js";
import {
	combineChunks,
	decodeBytes,
	encodeBytes,
	entries,
	events,
	fromEntries,
	keys,
	libName,
	mkErr,
	noOp
} from "./utils.js";

const TypedArray = Object.getPrototypeOf(Uint8Array);
const typeByteLimit = 12;
const typeIndex = 0;
const nonceIndex = typeIndex + typeByteLimit;
const tagIndex = nonceIndex + 1;
const progressIndex = tagIndex + 1;
const payloadIndex = progressIndex + 1;
const chunkSize = 16 * 2 ** 10 - payloadIndex;
const oneByteMax = 0xFF;
const buffLowEvent = "bufferedamountlow";

export default async (
	onPeer: (joinHook: (peer: ExtendedInstance, id: string) => void) => void,
	onSelfLeave: () => void,
	encryptDecrypt?: {
		encrypt: (toId: string, data: Uint8Array) => Promise<Uint8Array>;
		decrypt: (fromId: string, data: Uint8Array) => Promise<Uint8Array>;
		hasKey: (id: string) => boolean;
		IV_LENGTH: number;
	}
): Promise<Room> => {
	const peerMap: { [s: string]: ExtendedInstance } = {};
	const actions: {
		[x: string]: {
			onComplete: (data: any, peerId: string, metadata?: Metadata) => void;
			onProgress: (
				percent: number,
				peerId: string,
				metadata?: Metadata
			) => void;
		};
	} = {};
	const pendingTransmissions: {
		[x: string]: { [x: string]: { [x: string]: any } };
	} = {};
	const pendingPongs: { [x: string]: (value?: unknown) => void } = {};
	const pendingStreamMetas: { [x: string]: any } = {};
	const pendingTrackMetas: { [x: string]: any } = {};

	const iterate = (
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

	const exitPeer = (id: string) => {
		if (!peerMap[id]) {
			return;
		}

		delete peerMap[id];
		delete pendingTransmissions[id];
		delete pendingPongs[id];
		onPeerLeave(id);
	};

	const makeAction: MakeAction = (type: string) => {
		if (!type) {
			throw mkErr("action type argument is required");
		}

		const typeEncoded = encodeBytes(type);

		if (typeEncoded.byteLength > typeByteLimit) {
			throw mkErr(
				`action type string "${type}" (${typeEncoded.byteLength}b) exceeds ` +
					`byte limit (${typeByteLimit}). Hint: choose a shorter name.`
			);
		}

		const typeBytes = new Uint8Array(typeByteLimit);
		typeBytes.set(typeEncoded);

		const typePadded = decodeBytes(typeBytes);

		if (actions[typePadded]) {
			throw mkErr(`action '${type}' already registered`);
		}

		let nonce = 0;

		actions[typePadded] = { onComplete: noOp, onProgress: noOp };

		const actionSender: ActionSender = async (
			data,
			targets,
			meta,
			onProgress
		) => {
			if (meta && typeof meta !== "object") {
				throw mkErr("action meta argument must be an object");
			}

			if (data === undefined) {
				throw mkErr("action data cannot be undefined");
			}

			if (!targets) {
				targets = keys(peerMap);
			}

			const isJson = typeof data !== "string";
			const isFile = data instanceof File;
			const isBlob = data instanceof Blob;
			const isBinary =
				isBlob || data instanceof ArrayBuffer || data instanceof TypedArray;

			if (meta && !isBinary) {
				throw mkErr("action meta argument can only be used with binary data");
			}

			const buffer = await (async () => {
				if (isFile) {
					return encodeBytes(""); // we do not want to buffer the file, it is too large
				} else if (isBinary) {
					return new Uint8Array(isBlob ? await data.arrayBuffer() : data);
				} else {
					return encodeBytes(isJson ? JSON.stringify(data) : data);
				}
			})();

			const chunkTotal =
				(isFile
					? Math.ceil(data.size / chunkSize) + (meta ? 1 : 0)
					: Math.ceil(buffer.byteLength / chunkSize)) + (meta ? 1 : 0);

			const metaEncoded = encodeBytes(JSON.stringify(meta));
			const formatChunk = (
				chkValue: Uint8Array,
				chkIndex: number,
				isMeta: boolean
			) => {
				const isLast = chkIndex === chunkTotal - 1;
				const chunk = new Uint8Array(
					payloadIndex +
						(isMeta
							? metaEncoded.byteLength
							: (isLast
									? buffer.byteLength
									: chunkSize))
				);

				chunk.set(typeBytes);
				chunk.set([nonce], nonceIndex);
				chunk.set(
					[
						// @ts-ignore
						isLast |
							// @ts-ignore
							(isMeta << 1) |
							// @ts-ignore
							(isBinary << 2) |
							// @ts-ignore
							(isJson << 3) |
							// @ts-ignore
							(isFile << 4)
					],
					tagIndex
				);
				chunk.set(
					[Math.round(((chkIndex + 1) / chunkTotal) * oneByteMax)],
					progressIndex
				);
				chunk.set(chkValue, payloadIndex);
				console.log(decodeBytes(chunk));
				return new Uint8Array(chunk);
			};

			const chunks =
				!isFile &&
				Array.from({ length: chunkTotal })
					.fill(new Uint8Array(chunkSize))
					.map((_, i) => {
						return Boolean(meta) && i === 0
							? formatChunk(metaEncoded, i, true)
							: formatChunk(
								meta
									? buffer.subarray((i - 1) * chunkSize, i * chunkSize)
									: buffer.subarray(i * chunkSize, (i + 1) * chunkSize),
								i,
								false
							  );
					});

			const getFileChunk = (chunkN: number) =>
				new Promise<Uint8Array>((res, rej) => {
					if (Boolean(meta) && chunkN === 0) {
						res(formatChunk(metaEncoded, chunkN, true));
					} else {
						const dataStart = meta
							? (chunkN - 1) * chunkSize
							: chunkN * chunkSize;
						const dataEnd = meta
							? chunkN * chunkSize
							: (chunkN + 1) * chunkSize;

						data
							.slice(dataStart, dataEnd)
							.arrayBuffer()
							.then((buffer: ArrayBuffer) =>
								res(formatChunk(new Uint8Array(buffer), chunkN, false))
							)
							.catch((error: Error) => rej(error));
					}
				});

			nonce = (nonce + 1) & oneByteMax;

			return Promise.all(
				iterate(targets, async (id, peer) => {
					const chan = peer._channel;
					let chunkN = 0;

					while (chunkN < chunkTotal) {
						const chunk = chunks ? chunks[chunkN] : await getFileChunk(chunkN);

						if (chan.bufferedAmount > chan.bufferedAmountLowThreshold) {
							await new Promise<void>((res) => {
								const next = () => {
									chan.removeEventListener(buffLowEvent, next);
									res();
								};

								chan.addEventListener(buffLowEvent, next);
							});
						}

						if (!peerMap[id]) {
							break;
						}

						if (encryptDecrypt && encryptDecrypt.hasKey(id)) {
							const encChunk = await encryptDecrypt.encrypt(id, chunk);
							peer.send(encChunk);
						} else {
							peer.send(chunk);
						}
						chunkN++;

						if (onProgress) {
							onProgress(chunk[progressIndex] / oneByteMax, id, meta);
						}
					}
				})
			);
		};

		return [
			actionSender,

			// functions are passed in and "registered" based on their type
			(onComplete: (data: any, peerId: string, metadata?: Metadata) => void) =>
				(actions[typePadded] = { ...actions[typePadded], onComplete }),

			(
				onProgress: (
					percent: number,
					peerId: string,
					metadata?: Metadata
				) => void
			) => (actions[typePadded] = { ...actions[typePadded], onProgress })
		];
	};

	const handleData = async (id: string, data: any) => {
		const buffer = await (async () => {
			const payloadRaw = new Uint8Array(data);
			if (encryptDecrypt && encryptDecrypt.hasKey(id)) {
				const dec = await encryptDecrypt
					.decrypt(id, payloadRaw)
					.catch((error) => {
						throw console.error(error);
					});
				return dec;
			} else {
				return payloadRaw;
			}
		})();

		const type = decodeBytes(buffer.subarray(typeIndex, nonceIndex));
		const [nonce] = buffer.subarray(nonceIndex, tagIndex);
		const [tag] = buffer.subarray(tagIndex, progressIndex);
		const [progress] = buffer.subarray(progressIndex, payloadIndex);
		const isLast = Boolean(tag & 1);
		const isMeta = Boolean(tag & (1 << 1));
		const isBinary = Boolean(tag & (1 << 2));
		const isJson = Boolean(tag & (1 << 3));
		const isFile = Boolean(tag & (1 << 4));
		const payload = buffer.subarray(
			encryptDecrypt && encryptDecrypt.hasKey(id) && !isFile
				? payloadIndex + 2
				: payloadIndex,
			buffer.length
		);

		console.log(decodeBytes(payload));

		if (!actions[type]) {
			throw mkErr(`received message with unregistered type (${type})`);
		}

		if (!pendingTransmissions[id]) {
			pendingTransmissions[id] = {};
		}

		if (!pendingTransmissions[id][type]) {
			pendingTransmissions[id][type] = {};
		}

		let target = pendingTransmissions[id][type][nonce];

		if (!target) {
			target = pendingTransmissions[id][type][nonce] = isFile
				? {
						fileWriter: undefined
				  }
				: { chunks: [] };
		}

		if (isMeta) {
			target.meta = JSON.parse(decodeBytes(payload));
			if (!target.fileWriter) {
				const fileWriter = streamSaver
					.createWriteStream(target.meta.name, {
						size: target.meta.size // (optional filesize, default: undefined)
					})
					.getWriter();
				// const fileHandle = await showSaveFilePicker({ //TODO: fixme later, the other approach has a 4g limit
				//   suggestedName: target.meta.name,
				//   _preferPolyfill: false,
				//   excludeAcceptAllOption: false, // default
				// });

				// const fileWriter = await fileHandle.createWritable();
				target.fileWriter = fileWriter;
			}
		} else {
			if (isFile) {
				if (target.fileWriter) {
					await target.fileWriter.write(payload);
				}
			} else {
				target.chunks.push(payload);
			}
		}

		actions[type].onProgress(progress / oneByteMax, id, target.meta);

		if (!isLast) {
			return;
		}

		if (isFile) {
			await target.fileWriter.close();
			actions[type].onComplete({ success: true }, id, target.meta);
		} else {
			const full = combineChunks(target.chunks);

			if (isBinary) {
				actions[type].onComplete(full, id, target.meta);
			} else {
				const text = decodeBytes(full);
				actions[type].onComplete(isJson ? JSON.parse(text) : text, id);
			}
		}
		delete pendingTransmissions[id][type][nonce];
	};

	const [sendPing, getPing] = makeAction("__91n6__");
	const [sendPong, getPong] = makeAction("__90n6__");
	const [sendSignal, getSignal] = makeAction("__516n4L__");
	const [sendStreamMeta, getStreamMeta] = makeAction("__57r34m__");
	const [sendTrackMeta, getTrackMeta] = makeAction("__7r4ck__");

	let onPeerJoin: (arg0: string) => void = noOp;
	let onPeerLeave: (arg0: string) => void = noOp;
	let onPeerStream: (arg0: any, arg1: string, arg2: any) => void = noOp;
	let onPeerTrack: (arg0: any, arg1: any, arg2: string, arg3: any) => void =
		noOp;

	onPeer((peer: ExtendedInstance, id: string) => {
		if (peerMap[id]) {
			return;
		}

		const onData = handleData.bind(null, id);

		peerMap[id] = peer;

		peer.on(events.signal, (sdp) => sendSignal(sdp, id));
		peer.on(events.close, () => exitPeer(id));
		peer.on(events.data, onData);

		peer.on(events.stream, (stream) => {
			onPeerStream(stream, id, pendingStreamMetas[id]);
			delete pendingStreamMetas[id];
		});

		peer.on(events.track, (track, stream) => {
			onPeerTrack(track, stream, id, pendingTrackMetas[id]);
			delete pendingTrackMetas[id];
		});

		peer.on(events.error, (e) => {
			if (e.code === "ERR_DATA_CHANNEL") {
				return;
			}
			console.error(e);
		});

		onPeerJoin(id);
		peer.__drainEarlyData(onData);
	});

	getPing((_: any, id: string) => sendPong(null, id));

	getPong((_: any, id: string) => {
		if (pendingPongs[id]) {
			pendingPongs[id]();
			delete pendingPongs[id];
		}
	});

	getSignal((sdp: SignalData | string, id: string) => {
		if (peerMap[id]) {
			peerMap[id].signal(sdp);
		}
	});

	getStreamMeta((meta: any, id: string) => (pendingStreamMetas[id] = meta));

	getTrackMeta((meta: any, id: string) => (pendingTrackMetas[id] = meta));

	return {
		makeAction,

		ping: async (id: string) => {
			if (!id) {
				throw mkErr("ping() must be called with target peer ID");
			}

			const start = Date.now();
			sendPing(null, id);
			await new Promise((res) => (pendingPongs[id] = res));
			return Date.now() - start;
		},

		leave: () => {
			for (const [id, peer] of entries(peerMap)) {
				peer.destroy();
				delete peerMap[id];
			}
			onSelfLeave();
		},

		getPeers: () =>
			fromEntries(entries(peerMap)
				.map(([id, peer]) => [id, peer._pc])),

		addStream: (stream: MediaStream, targets: TargetPeers, meta: Metadata) =>
			targets
				? iterate(targets, async (id, peer) => {
					if (meta) {
						await sendStreamMeta(meta, id);
					}

					peer.addStream(stream);
				  })
				: [],

		removeStream: (stream: MediaStream, targets: TargetPeers) =>
			targets &&
			iterate(
				targets,
				(_, peer) =>
					new Promise((res) => {
						peer.removeStream(stream);
						res();
					})
			),

		addTrack: (
			track: MediaStreamTrack,
			stream: MediaStream,
			targets: TargetPeers,
			meta: Metadata
		) =>
			targets
				? iterate(targets, async (id, peer) => {
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
				? iterate(targets, async (id, peer) => {
					if (meta) {
						await sendTrackMeta(meta, id);
					}

					peer.replaceTrack(oldTrack, newTrack, stream);
				  })
				: [],

		onPeerJoin: (f: (arg0: string) => void) => (onPeerJoin = f),

		onPeerLeave: (f: (arg0: string) => void) => (onPeerLeave = f),

		onPeerStream: (f: (arg0: any, arg1: string, arg2: any) => void) =>
			(onPeerStream = f),

		onPeerTrack: (f: (arg0: any, arg1: any, arg2: string, arg3: any) => void) =>
			(onPeerTrack = f)
	};
};
