import { oneByteMax } from "../../helpers/consts/consts";
import { findUserAndDecrypt } from "../../helpers/cryptography/cryptoSuite";
import { base64ToBytes } from "../../helpers/dataHandling/b64util";
import {
	combineChunks,
	decodeBytes
} from "../../helpers/dataHandling/uint8util";
import { mkErr } from "../../helpers/utils";
import { useUserStore } from "../../stateManagers/userManagers/userStore";
import { useRoomStateManager } from "./state/stateManager";

export const handleData = async (id: string, data: any) => {
	try {
		const buffer = await (async () => {
			const payloadRaw = new Uint8Array(data);
			const keyedUsers = useUserStore.getState().keyedUsers;
			if (keyedUsers.has(id)) {
				const dec = await findUserAndDecrypt(id, payloadRaw);
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

		const actions = useRoomStateManager.getState().actions;
		const pendingTransmissions =
      useRoomStateManager.getState().pendingTransmissions;

		if (!(typeBytes in actions)) {
			throw mkErr(`received message with unregistered type (${typeBytes})`);
		}

		if (!pendingTransmissions[id]) {
			pendingTransmissions[id] = {};
		}

		if (!pendingTransmissions[id][typeBytes]) {
			pendingTransmissions[id][typeBytes] = {};
		}

		const target =
      pendingTransmissions[id][typeBytes][nonce] ||
      (pendingTransmissions[id][typeBytes][nonce] = {
      	chunks: []
      });

		if (isMeta) {
			target.meta = JSON.parse(decodeBytes(payload));
		} else {
			target.chunks.push(payload);
		}

		actions[typeBytes].onProgress(progress / oneByteMax, id, target.meta);

		if (!isLast) {
			return;
		}

		const full = combineChunks(target.chunks);

		if (isBinary) {
			actions[typeBytes].onComplete(full, id, target.meta);
		} else {
			const text = decodeBytes(full);
			actions[typeBytes].onComplete(isJson ? JSON.parse(text) : text, id);
		}

		delete pendingTransmissions[id][typeBytes][nonce];
	} catch (error) {
		console.error(error);
	}
};
