/* eslint-disable jsx-a11y/media-has-caption */
import AudioMotionAnalyzer from "audiomotion-analyzer";
import { Box, Text } from "grommet";
import { useCallback, useEffect, useRef } from "preact/hooks";
import { generateHexColorFromString } from "../helpers";

export default function StreamPlayer({
	stream,
	username,
	id,
	isMuted = false
}: {
  stream: MediaStream;
  username: string;
  id: string;
  isMuted?: boolean;
}) {
	const player = useRef<HTMLVideoElement>(null);
	const eqContainer = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (player.current) {
			player.current.srcObject = stream;
		}
		if (
			stream.getVideoTracks()?.length === 0 &&
      stream.getAudioTracks()?.length > 0
		) {
			deployEqualizer(stream);
		}
	}, [player, stream, id]);

	const deployEqualizer = useCallback((mediaStream: MediaStream) => {
		const container = document.createElement("div");
		container.style.width = "15vh";

		const audioMotion = new AudioMotionAnalyzer(container, {
			height: 150,
			width: 150,
			// you can set other options below - check the docs!
			mode: 3,
			barSpace: 0.6,
			showScaleX: false,
			ledBars: true
		});

		// create stream using audioMotion audio context
		const micStream = audioMotion.audioCtx.createMediaStreamSource(mediaStream);
		// connect microphone stream to analyzer
		audioMotion.connectInput(micStream);
		// mute output to prevent feedback loops from the speakers
		audioMotion.volume = 0;

		eqContainer.current?.append(container);
	}, []);

	return (
		<Box
			round="small"
			border={{ color: generateHexColorFromString(id), size: "medium" }}
			className="handle"
			style={{
				height: "20em",
				width: "30em",
				resize: "both",
				overflow: "hidden"
			}}
		>
			<Text color={generateHexColorFromString(id)}>{username}</Text>
			{stream.getVideoTracks()?.length === 0 ? (
				<>
					<video autoPlay muted={isMuted} hidden ref={player} />
					<Box ref={eqContainer} />
				</>
			) : (
				<video
					autoPlay
					muted={isMuted}
					ref={player}
				/>
			)}
		</Box>
	);
}