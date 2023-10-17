import { base64ToBytes } from "../helpers/b64util";
import { oneByteMax } from "../helpers/consts";
import { EncryptDecryptObj } from "../helpers/types";
import { combineChunks, decodeBytes, mkErr } from "../helpers/utils";
import { RoomStateManager } from "./stateManager";

export const buildHandleData =
	(roomState: RoomStateManager, encryptDecrypt: EncryptDecryptObj) =>
		async (id: string, data: any) => {
			try {
				const buffer = await (async () => {
					const payloadRaw = new Uint8Array(data);
					if (encryptDecrypt && encryptDecrypt?.ecPeerlist()
						.includes(id)) {
						const dec = await encryptDecrypt
							.decrypt(id, payloadRaw)
							.catch((error) => {
								throw console.error(error);
							});
						return JSON.parse(decodeBytes(dec));
					} else {
						return JSON.parse(decodeBytes(payloadRaw));
					}
				})();

				const {
					typeBytes,
					nonce,
					isLast,
					isMeta,
					isBinary,
					isJson,
					progress,
					payload: plenc
				} = buffer;
				const payload = base64ToBytes(plenc);

				if (!roomState.actions[typeBytes]) {
					throw mkErr(`received message with unregistered type (${typeBytes})`);
				}

				if (!roomState.pendingTransmissions[id]) {
					roomState.pendingTransmissions[id] = {};
				}

				if (!roomState.pendingTransmissions[id][typeBytes]) {
					roomState.pendingTransmissions[id][typeBytes] = {};
				}

				let target = roomState.pendingTransmissions[id][typeBytes][nonce];

				if (!target) {
					target = roomState.pendingTransmissions[id][typeBytes][nonce] = {
						chunks: []
					};
				}

				if (isMeta) {
					target.meta = JSON.parse(decodeBytes(payload));
				} else {
					target.chunks.push(payload);
				}

				roomState.actions[typeBytes].onProgress(
					progress / oneByteMax,
					id,
					target.meta
				);

				if (!isLast) {
					return;
				}

				const full = combineChunks(target.chunks);

				if (isBinary) {
					roomState.actions[typeBytes].onComplete(full, id, target.meta);
				} else {
					const text = decodeBytes(full);
					roomState.actions[typeBytes].onComplete(
						isJson ? JSON.parse(text) : text,
						id
					);
				}

				delete roomState.pendingTransmissions[id][typeBytes][nonce];
			} catch (error) {
				console.error(error);
			}
		};
