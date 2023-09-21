import { funAnimalName } from "fun-animal-names";
import { useState } from "preact/hooks";
import shortid from "shortid";
import { useMessageStore } from "../stateManagers/messageStore";

export function useExtendedState<T>(initialState: T) {
	const [state, setState] = useState<T>(initialState);
	const getLatestState = () =>
		new Promise<T>((resolve) => {
			setState((s) => {
				resolve(s);
				return s;
			});
		});

	return [state, setState, getLatestState] as const;
}

export const fancyBytes = (bytes: number) => {
	const size = Math.floor(bytes / 1e6);
	return size < 1 ? `${Math.floor(bytes / 1e3)}Kb` : `${size}Mb`;
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
			id: shortid.generate(),
			text,
			sentAt: Date.now(),
			roomId,
			sentBy: "system",
			recievedAt: Date.now()
		});

export const generateHexColorFromString = (str: string) => {
	// Calculate a hash value for the string
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = str.codePointAt(i)! + ((hash << 5) - hash);
	}

	// Convert the hash value to a 6-digit hexadecimal color
	let color = (hash & 0x00_FF_FF_FF).toString(16);
	color = "00000".slice(0, Math.max(0, 6 - color.length)) + color;

	// if color is too dark make it lighter
	if (Number.parseInt(color, 16) < 0x88_88_88) {
		color = (Number.parseInt(color, 16) + 0x88_88_88).toString(16);
	}

	return `#${color}`;
};

export const randomName = () =>
	funAnimalName(Math.random()
		.toString(36)
		.slice(7));
