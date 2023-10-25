import { chunkSize, oneByteMax } from "../../helpers/consts/consts";
import { findUserAndEncrypt } from "../../helpers/cryptography/cryptoSuite";
import { bytesToBase64 } from "../../helpers/dataHandling/b64util";
import { encodeBytes } from "../../helpers/dataHandling/uint8util";
import {
	ActionProgress,
	ActionReceiver,
	ActionSender,
	Metadata
} from "../../helpers/types/distraTypes";
import { iterate, mkErr, noOp } from "../../helpers/utils";
import { useUserStore } from "../../stateManagers/userManagers/userStore";
import { useRoomStateManager } from "./state/stateManager";
export const makeAction = <T>(
	type: string,
	forceEncryption?: boolean | undefined
) => {
	if (!type) {
		throw mkErr("action type argument is required");
	}

	if (useRoomStateManager.getState().actions[type]) {
		throw mkErr(`action '${type}' already registered`);
	}

	let nonce = 0;

	useRoomStateManager
		.getState()
		.setActions(type, { onComplete: noOp, onProgress: noOp });

	const actionSender: ActionSender<T> = async (
		data,
		targets,
		meta,
		onProgress
	) => {
		if (meta && typeof meta !== "object") {
			throw mkErr("action meta argument must be an object");
		}

		// if (data === undefined) {
		// 	throw mkErr("action data cannot be undefined");
		// }

		// if (!data || Object.keys(data).length === 0) {
		// 	throw mkErr("data is undefined");
		// }

		if (!targets) {
			targets = Object.keys(useRoomStateManager.getState().peerMap);
		}

		const isBlob = data instanceof Blob;
		const isBinary =
      isBlob || data instanceof ArrayBuffer || data instanceof Uint8Array;
		const isJson = typeof data !== "string" && !isBinary && !isBlob;

		if (meta && !isBinary) {
			throw mkErr("action meta argument can only be used with binary data");
		}

		const buffer = isBinary
			? new Uint8Array(isBlob ? await data.arrayBuffer() : data)
			: encodeBytes(isJson ? JSON.stringify(data) : (data as string));

		const chunkTotal =
      Math.ceil(buffer.byteLength / chunkSize) + (meta ? 1 : 0);

		const metaEncoded = encodeBytes(JSON.stringify(meta));
		const formatChunk = (
			chkValue: Uint8Array,
			chkIndex: number,
			isMeta: boolean
		) => {
			const isLast = chkIndex === chunkTotal - 1;

			const chkTmp = JSON.stringify({
				typeBytes: type,
				nonce,
				isLast,
				isMeta,
				isBinary,
				isJson,
				progress: Math.round(((chkIndex + 1) / chunkTotal) * oneByteMax),
				payload: bytesToBase64(chkValue)
			});

			return encodeBytes(chkTmp);
		};

		nonce = (nonce + 1) & oneByteMax;
		return Promise.all(
			iterate(
				useRoomStateManager.getState().peerMap,
				targets,
				async (id, peer) => {
					const chan = peer._channel;
					let chunkN = 0;

					while (chunkN < chunkTotal) {
						const chunk = (() => {
							if (chunkN === 0 && meta) {
								return formatChunk(metaEncoded, chunkN, true);
							} else {
								return meta
									? formatChunk(
										buffer.subarray(
											(chunkN - 1) * chunkSize,
											chunkN * chunkSize
										),
										chunkN,
										false
									)
									: formatChunk(
										buffer.subarray(
											chunkN * chunkSize,
											(chunkN + 1) * chunkSize
										),
										chunkN,
										false
									);
							}
						})();

						if (chan.bufferedAmount > chan.bufferedAmountLowThreshold) {
							await new Promise<void>((res) => {
								const next = () => {
									chan.removeEventListener("bufferedamountlow", next);
									res();
								};

								chan.addEventListener("bufferedamountlow", next);
							});
						}

						if (!useRoomStateManager.getState().peerMap[id]) {
							break;
						}

						if (forceEncryption) {
							if (useUserStore.getState().keyedUsers.has(id)) {
								const encChunk = await findUserAndEncrypt(id, chunk);
								peer.send(encChunk);
							} // fail if chunk cannot be encrypted
						} else {
							peer.send(chunk);
						}
						chunkN++;

						if (onProgress) {
							onProgress(chunkN / chunkTotal, id, meta);
						}
					}
				}
			)
		);
	};

	return [
		actionSender,

		// functions are passed in and "registered" based on their type
		(onComplete) =>
			(useRoomStateManager.getState().actions[type] = {
				...useRoomStateManager.getState().actions[type],
				onComplete
			}),

		(
			onProgress: (percent: number, peerId: string, metadata?: Metadata) => void
		) =>
			(useRoomStateManager.getState().actions[type] = {
				...useRoomStateManager.getState().actions[type],
				onProgress
			})
	] as [ActionSender<T>, ActionReceiver<T>, ActionProgress]; //
};
