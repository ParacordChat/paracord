/* eslint-disable jsx-a11y/media-has-caption */
import { funAnimalName } from "fun-animal-names";
import { Box, Button, Footer, Text } from "grommet";
import { Camera, Close, Monitor, Phone, View } from "grommet-icons";
import { useState } from "preact/hooks";
import { Room, selfId } from "trystero";
import { generateHexColorFromString } from "../helpers/helpers";
import { useUserStore } from "../stateManagers/userManagers/userStore";
import StreamPlayer from "./helpers/StreamPlayer";

interface VideoBubble {
	id: string;
	stream: MediaStream;
	isAudioOnly: boolean;
	isViewOnly?: boolean;
}

export function CallView(props: { room: Room }) {
	const { room } = props;
	const [isSharing, setIsSharing] = useState(false);
	const [videoBubbles, setVideoBubbles] = useState<VideoBubble[]>([]);
	const [callConsent, setCallConsent] = useState(false);
	const [myStream, setMyStream] = useState<MediaStream>();
	const [[joinRoom, getRoomJoined]] = useState(() =>
		room.makeAction("joinRTCRoom", true)
	);
	const userNames = useUserStore((state) =>
		state.users.map((p) => {
			return { id: p.id, name: p.name };
		})
	);

	useState(() => {
		room.onPeerStream((stream, peerId) => {
			const existingStream = videoBubbles.find((p) => p.id === peerId);
			const isAudioOnly = stream.getVideoTracks().length === 0;
			// if this peer hasn't sent a stream before, create a video element
			if (existingStream) {
				room.removeStream(existingStream.stream);
			}
			stream.addEventListener("removetrack", () => {
				// videoParent.remove();
				setVideoBubbles(videoBubbles.filter((vb) => vb.id !== peerId));

				room.removeStream(stream);
			});
			setVideoBubbles([...videoBubbles, { id: peerId, stream, isAudioOnly }]);
		});
		getRoomJoined((type, id) => {
			if (type === "view") {
				setVideoBubbles([
					...videoBubbles,
					{ id, stream: new MediaStream(), isAudioOnly: false }
				]);
			} else if (type === "cutStream") {
				setVideoBubbles(videoBubbles.filter((vb) => vb.id !== id));
			}
			if (myStream) {
				room.addStream(myStream, id); // TODO: refreshing streams in room still dosen't work...
			}
		});
	});

	const uiInteractive = useUserStore((state) =>
		state.users.some((p) => p.active)
	);

	const shareMedia = async (
		type: "phone" | "video" | "screen" | "cutStream" | "view"
	) => {
		if (type === "cutStream") {
			if (myStream) {
				[...videoBubbles.map((vb) => vb.stream), myStream].forEach((stream) => {
					room.removeStream(stream);
				});
			}

			setVideoBubbles([]);

			joinRoom("cutStream");

			setMyStream(undefined);

			setCallConsent(false);
		} else if (type === "view") {
			setCallConsent(true);
			joinRoom("view");
			setMyStream(undefined);
		} else {
			setCallConsent(true);

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
				room.addStream(selfStream);
				joinRoom(type);
				setMyStream(selfStream);
			}
		}
	};

	return (
		<>
			<Box>
				{callConsent && (
					<Box>
						{myStream ? (
							<StreamPlayer
								isMuted={true}
								stream={myStream}
								username="You"
								id={selfId}
							/>
						) : (
							<Box
								round="small"
								maxWidth="50em"
								border={{
									color: generateHexColorFromString(selfId),
									size: "medium"
								}}
							>
								<Text color={generateHexColorFromString(selfId)}>You</Text>
								<View size="xlarge" />
							</Box>
						)}
						<Box>
							{videoBubbles.map((bubble) => (
								<StreamPlayer
									key={bubble.id}
									stream={bubble.stream}
									username={
										userNames.find((p) => p.id === bubble.id)?.name ||
										funAnimalName(bubble.id)
									}
									id={bubble.id}
								/>
							))}
						</Box>
					</Box>
				)}
				<Footer round="small" background="brand" pad="medium">
					<Box direction="column" gap="small">
						{isSharing ? (
							<Button
								onClick={() => {
									shareMedia("cutStream")
										.then(() => setIsSharing(false));
								}}
								hoverIndicator
								icon={<Close />}
								label="Leave Call"
							/>
						) : (
							<Box direction="row" gap="small">
								<Button
									disabled={!uiInteractive}
									onClick={() => {
										shareMedia("phone")
											.then(() => setIsSharing(true));
									}}
									hoverIndicator
									icon={<Phone />}
									label="Audio Only"
								/>
								<Button
									disabled={!uiInteractive}
									onClick={() => {
										shareMedia("video")
											.then(() => setIsSharing(true));
									}}
									hoverIndicator
									icon={<Camera />}
									label="Camera"
								/>
								<Button
									disabled={!uiInteractive}
									onClick={() => {
										shareMedia("screen")
											.then(() => setIsSharing(true));
									}}
									hoverIndicator
									icon={<Monitor />}
									label="Desktop share"
								/>
								<Button
									disabled={!uiInteractive}
									onClick={() => {
										shareMedia("view")
											.then(() => setIsSharing(true));
									}}
									hoverIndicator
									icon={<View />}
									label="View"
								/>
							</Box>
						)}
					</Box>
				</Footer>
			</Box>
		</>
	);
}
// TODO: some way to let other people see a list of lurkers
