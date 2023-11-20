import { chunkSize, oneByteMax } from "../../helpers/consts/consts";
import { encryptData } from "../../helpers/cryptography/cryptoSuite";
import { bytesToBase64 } from "../../helpers/dataHandling/b64util";
import { encodeBytes } from "../../helpers/dataHandling/uint8util";
import {
	ActionProgress,
	ActionReceiver,
	ActionSender,
	StrictMetadata
} from "../../helpers/types/distraTypes";
import { genId, mkErr, noOp } from "../../helpers/utils";
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

	useRoomStateManager
		.getState()
		.setActions(type, { onComplete: noOp, onProgress: noOp });

	const getPeerMap = () => Object.keys(useRoomStateManager.getState().peerMap);

	const actionSender: ActionSender<T> = async (
		data,
		targets,
		meta,
		onProgress
	) => {
		if (meta && typeof meta !== "object") {
			throw mkErr("action meta argument must be an object");
		}

		if (!targets) {
			targets = getPeerMap();
		}

		const uuid = genId(6);
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

		const formatChunk = (
			chkValue: Uint8Array | StrictMetadata,
			chkIndex: number,
			isMeta: boolean
		) => {
			const isLast = chkIndex === chunkTotal - 1;
			const chkTmp = JSON.stringify({
				typeBytes: type,
				uuid,
				isLast,
				isMeta,
				isBinary,
				isJson,
				progress: Math.round(((chkIndex + 1) / chunkTotal) * oneByteMax),
				payload: bytesToBase64(
					// @ts-ignore
					isMeta ? encodeBytes(JSON.stringify(meta)) : chkValue
				)
			});

			return encodeBytes(chkTmp);
		};

		const fixedTgts = typeof targets === "string" ? [targets] : targets;
		await Promise.all(
			fixedTgts.map(async (iterable) => {
				const peer =
          typeof iterable === "string"
          	? useRoomStateManager.getState().peerMap[iterable]
          	: useRoomStateManager.getState().peerMap[iterable.id];
				if (!peer) {
					return;
				}

				const chan = peer._channel;
				let chunkN = 0;

				while (chunkN < chunkTotal) {
					const chunk = (() => {
						return chunkN === 0 && meta
							? formatChunk(meta, chunkN, true)
							: formatChunk(
								// TODO: perhaps you could track the chunk point you left off on and start from there
								meta
									? buffer.slice((chunkN - 1) * chunkSize, chunkN * chunkSize)
									: buffer.slice(
										chunkN * chunkSize,
										(chunkN + 1) * chunkSize
									),
								chunkN,
								false
							);
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

					if (forceEncryption) {
						if (typeof iterable === "string") {
							const sendKey = useUserStore
								.getState()
								.users.find((user) => user.id === iterable)?.quantumSend;
							if (sendKey) {
								encryptData(chunk, sendKey)
									.then((encryptedChunk) =>
										peer.send(encryptedChunk)
									);
							}
						} else {
							if (iterable.quantumSend) {
								encryptData(chunk, iterable.quantumSend)
									.then(
										(encryptedChunk) => peer.send(encryptedChunk)
									);
							}
						}
					} else {
						peer.send(chunk);
					}
					chunkN++;

					if (onProgress) {
						onProgress(
							chunkN / chunkTotal,
							typeof iterable === "string" ? iterable : iterable.id,
							meta
						);
					}
				}
			})
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
			onProgress: (
        percent: number,
        peerId: string,
        metadata?: StrictMetadata,
      ) => void
		) =>
			(useRoomStateManager.getState().actions[type] = {
				...useRoomStateManager.getState().actions[type],
				onProgress
			})
	] as [ActionSender<T>, ActionReceiver<T>, ActionProgress]; //
};
