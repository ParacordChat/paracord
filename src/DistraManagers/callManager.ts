import { Room } from "../Distra";
import { useCallPrefsState } from "../stateManagers/commsManagers/personalCallPrefs";
import { useClientSideUserTraits } from "../stateManagers/userManagers/clientSideUserTraits";

export type RoomActionType =
	| "phone"
	| "video"
	| "screen"
	| "cutStream"
	| "view";

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
			if (existingStream && existingStream.stream) {
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
				const existingStream = useCallPrefsState
					.getState()
					.videoBubbles.find((p) => p.id === id);
				if (existingStream && existingStream.stream) {
					room.removeStream(existingStream.stream);
					useCallPrefsState.getState()
						.removeBubbleWithId(id);
				}
				useCallPrefsState.getState()
					.addVideoBubble({
						id,
						stream: undefined,
						isAudioOnly: false
					});
			} else if (type === "cutStream") {
				useCallPrefsState.getState()
					.removeBubbleWithId(id);
			}
		});
	}

	public shareMedia = async (
		type: RoomActionType,
		myStream: MediaStream | undefined
	) => {
		if (type === "cutStream") {
			const videoBubbles = useCallPrefsState.getState().videoBubbles;
			if (myStream) {
				[...videoBubbles.map((vb) => vb.stream), myStream].forEach(
					(stream) => stream && this.removeStream(stream)
				);
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
			useCallPrefsState.getState()
				.setIsSharing(true);
			if (myStream) {
				myStream.getTracks()
					.forEach((track) => {
						track.stop();
					});
				this.removeStream(myStream);
			}
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
				}
				this.addStream(selfStream);
				this.joinRoom(type)
					.then(() =>
						useCallPrefsState.getState()
							.setIsSharing(true)
					);

				return selfStream;
			}
		}
	};
}
