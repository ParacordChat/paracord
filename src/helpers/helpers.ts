import { funAnimalName } from "fun-animal-names";
import { useMessageStore } from "../stateManagers/messageStore";
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
	const canDataChannel = Boolean(
		peerConn && peerConn.prototype && peerConn.prototype.createDataChannel
	);
	return Boolean(peerConn) && canDataChannel;
};

export const sendSystemMessage = (roomId: string, text: string) =>
	useMessageStore.getState()
		.addMessage({
			id: genId(6),
			text,
			sentAt: Date.now(),
			roomId,
			sentBy: "system",
			recievedAt: Date.now()
		});

export const generateHexColorFromString = (str: string) => {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = str.codePointAt(i)! + ((hash << 5) - hash);
	}
	const color = (hash & 0x00_FF_FF_FF).toString(16);
	return `#${"00000".slice(0, Math.max(0, 6 - color.length))}${color}`;
};

export const randomName = () =>
	funAnimalName(Math.random()
		.toString(36)
		.slice(7));

export const confirmDialog = (msg: string) => {
	return new Promise(function (resolve, reject) {
		const confirmed = window.confirm(msg);

		return confirmed ? resolve(true) : reject(false);
	});
};
