/* eslint-disable jsx-a11y/media-has-caption */
import AudioMotionAnalyzer from "audiomotion-analyzer";
import { Box, Text } from "grommet";
import { View } from "grommet-icons";
import { useEffect, useRef } from "preact/hooks";
import { generateHexColorFromString } from "../../helpers/helpers";

export default function StreamPlayer(props: {
	stream: MediaStream;
	username: string;
	id: string;
	isMuted?: boolean;
}) {
	const { stream, username, id, isMuted } = props;
	const player = useRef<HTMLVideoElement>(null);
	const eqContainer = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (player.current) {
			player.current.srcObject = stream;
		}
		if (
			stream.getVideoTracks().length === 0 &&
			stream.getAudioTracks().length > 0
		) {
			deployEqualizer(stream);
		}
	}, [player, stream, id]);

	const deployEqualizer = (
		// TODO: no garbage collection for this?
		mediaStream: MediaStream
	) => {
		const container = document.createElement("div");
		container.style.width = "10em";

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

		if (eqContainer.current) eqContainer.current.append(container);
	};
	return (
		<Box
			round="small"
			maxWidth="50em"
			border={{ color: generateHexColorFromString(id), size: "medium" }}
		>
			<Text color={generateHexColorFromString(id)}>{username}</Text>
			{stream.getVideoTracks().length === 0 ? (
				<>
					{stream.getVideoTracks().length === 0 ? (
						<>
							<video
								autoPlay={true}
								muted={isMuted}
								style="display:none"
								ref={player}
							/>
							<Box
								ref={eqContainer}
								style={{ width: "10em", height: "10em" }}
							/>
						</>
					) : (
						<View size="xlarge" />
					)}
				</>
			) : (
				<>
					<video autoPlay={true} muted={isMuted} ref={player} />
				</>
			)}
		</Box>
	);
}
