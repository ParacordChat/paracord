import { base64ToBytes } from "../../helpers/dataHandling/b64util";
import { oneByteMax } from "../../helpers/consts/consts";
import { combineChunks, decodeBytes, mkErr } from "../../helpers/utils";
import { useUserStore } from "../../stateManagers/userManagers/userStore";
import { findUserAndDecrypt } from "../../helpers/cryptography/cryptoSuite";
import { useRoomStateManager } from "./state/stateManager";


export const handleData =
  	async (id: string, data: any) => {
  		try {
  			const buffer = await (async () => {
  				const payloadRaw = new Uint8Array(data);
  				if (useUserStore.getState().keyedUsers.has(id)) {
  					const dec = await findUserAndDecrypt(id, payloadRaw)
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

  			if (!useRoomStateManager.getState().actions[typeBytes]) {
  				throw mkErr(`received message with unregistered type (${typeBytes})`);
  			}

  			if (!useRoomStateManager.getState().pendingTransmissions[id]) {
  				useRoomStateManager.getState().pendingTransmissions[id] = {};
  			}

  			if (!useRoomStateManager.getState().pendingTransmissions[id][typeBytes]) {
  				useRoomStateManager.getState().pendingTransmissions[id][typeBytes] = {};
  			}

  			let target = useRoomStateManager.getState().pendingTransmissions[id][typeBytes][nonce];

  			if (!target) {
  				target = useRoomStateManager.getState().pendingTransmissions[id][typeBytes][nonce] = {
  					chunks: []
  				};
  			}

  			if (isMeta) {
  				target.meta = JSON.parse(decodeBytes(payload));
  			} else {
  				target.chunks.push(payload);
  			}

  			useRoomStateManager.getState().actions[typeBytes].onProgress(
  				progress / oneByteMax,
  				id,
  				target.meta
  			);

  			if (!isLast) {
  				return;
  			}

  			const full = combineChunks(target.chunks);

  			if (isBinary) {
  				useRoomStateManager.getState().actions[typeBytes].onComplete(full, id, target.meta);
  			} else {
  				const text = decodeBytes(full);
  				useRoomStateManager.getState().actions[typeBytes].onComplete(
  					isJson ? JSON.parse(text) : text,
  					id
  				);
  			}

  			delete useRoomStateManager.getState().pendingTransmissions[id][typeBytes][nonce];
  		} catch (error) {
  			console.error(error);
  		}
  	};
