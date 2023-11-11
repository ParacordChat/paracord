import {
	createVideoProcessor,
	createVideoTrackProcessorWithFallback,
	InputFrame
} from "@pexip/media-processor";
import { Room } from "../Distra";
import { useCallPrefsState } from "../stateManagers/commsManagers/personalCallPrefs";
import { useClientSideUserTraits } from "../stateManagers/userManagers/clientSideUserTraits";

export type RoomActionType =
	| "phone"
	| "video"
	| "screen"
	| "cutStream"
	| "view";

const getTrackProcessor = () => {
	// Feature detection if the browser has the `MediaStreamProcessor` API
	if ("MediaStreamTrackProcessor" in window) {
		return createVideoTrackProcessorWithFallback(); // Using the fallback implementation
	}
	return createVideoTrackProcessorWithFallback(); // Using the fallback implementation
};

const transformer = async (frame: InputFrame) => {
	return frame;
};

async function streamEncrypt(inputMediaStream: MediaStream) {
	const videoProcessor = createVideoProcessor(
		// TODO: https://www.npmjs.com/package/@pexip/media-processor
		[transformer], // TODO: you can add more processors here
		getTrackProcessor()
	);

	await videoProcessor.open();

	// Passing the raw MediaStream to apply the effects
	// Then, use the output stream for whatever purpose
	const processedStream = await videoProcessor.process(inputMediaStream);
	return processedStream;
}

export default class CallManager {
	private joinRoom;
	private removeStream;
	private addStream;

	constructor({ room }: { room: Room; roomId: string }) {
		const [joinRoom, getRoomJoined] = room.makeAction<RoomActionType>(
			"joinRTCRoom",
			true
		);

		const { addStream, removeStream } = room;

		this.addStream = addStream;
		this.removeStream = removeStream;

		this.joinRoom = joinRoom;

		room.onPeerStream((stream, peerId) => {
			const existingStream = useCallPrefsState
				.getState()
				.videoBubbles.find((p) => p.id === peerId);

			// if this peer hasn't sent a stream before, create a video element
			if (existingStream) {
				room.removeStream(existingStream.stream);
				useCallPrefsState.getState()
					.removeBubbleWithId(peerId);
			}
			stream.addEventListener("removetrack", () => {
				// videoParent.remove();
				useCallPrefsState.getState()
					.removeBubbleWithId(peerId);

				room.removeStream(stream);
			});
			const isAudioOnly = stream.getVideoTracks().length === 0;
			useCallPrefsState
				.getState()
				.addVideoBubble({ id: peerId, stream, isAudioOnly });
			if (useClientSideUserTraits.getState().activeTab !== "call") {
				useClientSideUserTraits.getState()
					.addtoNotifyTabs("call");
			}
		});
		getRoomJoined((type, id) => {
			if (type === "view") {
				useCallPrefsState.getState()
					.addVideoBubble({
						id,
						stream: new MediaStream(),
						isAudioOnly: false
					});
			} else if (type === "cutStream") {
				useCallPrefsState.getState()
					.removeBubbleWithId(id);
			}
			// if (useCallPrefsState.getState().myStream) {
			// 	addStream(useCallPrefsState.getState().myStream!, [id]); // TODO: refreshing streams in room still dosen't work...
			// }  //if you add back global mystream you may want to consider adding a function called "replacestream" on the room function
		});
	}

	public shareMedia = async (
		type: RoomActionType,
		myStream: MediaStream | undefined
	) => {
		if (type === "cutStream") {
			const videoBubbles = useCallPrefsState.getState().videoBubbles;
			if (myStream) {
				[...videoBubbles.map((vb) => vb.stream), myStream].forEach((stream) => {
					this.removeStream(stream);
				});
			}

			useCallPrefsState.getState()
				.clearVideoBubbles();

			this.joinRoom("cutStream");

			useCallPrefsState.getState()
				.setCallConsent(false);

			useCallPrefsState.getState()
				.setIsSharing(false);
		} else if (type === "view") {
			useCallPrefsState.getState()
				.setCallConsent(true);
			this.joinRoom("view");
		} else {
			useCallPrefsState.getState()
				.setCallConsent(true);

			// this object can store audio instances for later
			const selfStream = await (async () => {
				switch (type) {
					case "phone": {
						return await navigator.mediaDevices.getUserMedia({
							audio: true,
							video: false
						});
					}
					case "video": {
						return await navigator.mediaDevices.getUserMedia({
							audio: true,
							video: true
						});
					}
					case "screen": {
						return await navigator.mediaDevices.getDisplayMedia({
							audio: true,
							video: true
						});
					}
					default: {
						throw new Error("Invalid media type");
					}
				}
			})();
			if (selfStream) {
				// send stream to peers currently in the room
				if (myStream) {
					this.removeStream(myStream);

					const encryptedStream = streamEncrypt(selfStream);
					this.addStream(encryptedStream); // TODO: encrypt stream
					this.joinRoom(type)
						.then(() =>
							useCallPrefsState.getState()
								.setIsSharing(true)
						);
				} else {
					this.addStream(selfStream);
					this.joinRoom(type)
						.then(() =>
							useCallPrefsState.getState()
								.setIsSharing(true)
						);
				}
				return selfStream;
			}
		}
	};
}
