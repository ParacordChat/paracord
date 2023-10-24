import { StateUpdater } from "preact/hooks";
import { Room } from "../Distra";
import { useCallPrefsState } from "../stateManagers/RTCManagers/personalCallPrefs";

type RoomActionType = "phone" | "video" | "screen" | "cutStream" | "view";

export default class RTCManager {
	private joinRoom: (
    roomAction: RoomActionType,
    ids?: string | string[],
  ) => Promise<any[]>;
	private removeStream: (stream: MediaStream) => void;
	private addStream: (stream: MediaStream, ids?: string | string[]) => void;

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
			const isAudioOnly = stream.getVideoTracks().length === 0;
			// if this peer hasn't sent a stream before, create a video element
			if (existingStream) {
				room.removeStream(existingStream.stream);
			}
			stream.addEventListener("removetrack", () => {
				// videoParent.remove();
				useCallPrefsState.getState()
					.removeBubbleWithId(peerId);

				room.removeStream(stream);
			});
			useCallPrefsState
				.getState()
				.addVideoBubble({ id: peerId, stream, isAudioOnly });
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
			if (useCallPrefsState.getState().myStream) {
				console.log("adding stream",JSON.stringify(useCallPrefsState.getState().myStream));
				addStream(useCallPrefsState.getState().myStream!, id); // TODO: refreshing streams in room still dosen't work...
			}
		});
	}

	public shareMedia = async (type: RoomActionType, myStream:MediaStream|null, setMyStream:StateUpdater<MediaStream|null>) => {
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
				.setMyStream(null);

			useCallPrefsState.getState()
				.setCallConsent(false);
		} else if (type === "view") {
			useCallPrefsState.getState()
				.setCallConsent(true);
			this.joinRoom("view");
			useCallPrefsState.getState()
				.setMyStream(null);
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
				console.log("dd",selfStream);
				this.addStream(selfStream);
				this.joinRoom(type);
				console.log("adding slftream",myStream);
				setMyStream(selfStream);
				console.log("adding slftream",JSON.stringify(myStream));
			}
		}
	};
}
