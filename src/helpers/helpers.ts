import { funAnimalName } from "fun-animal-names";
import { useMessageStore } from "../stateManagers/commsManagers/messageStore";
import { genId } from "./utils";

export const fancyBytes = (bytes: number) => {
	const units = ["bytes", "KB", "MB", "GB"];
	let i = 0;
	while (bytes >= 1024 && i < units.length - 1) {
		bytes /= 1024;
		i++;
	}
	return `${bytes.toFixed(2)} ${units[i]}`;
};

export const isRtcSupported = () => {
	const peerConn =
    window.RTCPeerConnection ||
    // @ts-ignore
    window.mozRTCPeerConnection ||
    // @ts-ignore
    window.webkitRTCPeerConnection;
	const canDataChannel = Boolean(peerConn?.prototype?.createDataChannel);
	return Boolean(peerConn) && canDataChannel;
};

export const sendSystemMessage = (roomId: string, text: string) => {
	const now = Date.now();
	useMessageStore.getState()
		.addMessage({
			id: genId(6),
			text,
			sentAt: now,
			roomId,
			sentBy: "system",
			recievedAt: now
		});
};

export const generateHexColorFromString = (str: string) => {
	let hash = 0;
	[...str].forEach((char) => {
		hash = char.codePointAt(0)! + ((hash << 5) - hash);
	});
	const red = (hash >> 16) & 0xFF;
	const green = (hash >> 8) & 0xFF;
	const blue = hash & 0xFF;
	const color = ((red << 16) | (green << 8) | blue).toString(16);
	return `#${"00000".slice(0, Math.max(0, 6 - color.length))}${color}`;
};

export const randomName = () =>
	funAnimalName(Math.random()
		.toString(36)
		.slice(7));

export const confirmDialog = (msg: string) =>
	new Promise<boolean>((resolve, _reject) => {
		const confirmed = window.confirm(msg);
		return resolve(confirmed);
	});
