/* eslint-disable jsx-a11y/media-has-caption */
import AudioMotionAnalyzer from "audiomotion-analyzer";
import { Box, Text } from "grommet";
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

	useEffect(() => {
		console.log("stream", stream);
		console.log("player", player);
		if (player.current) {
			player.current.srcObject = stream;
		}
		if (stream.getVideoTracks().length === 0) {
			deployEqualizer(id, stream);
		}
	}, [player, stream]);

	const deployEqualizer = (
		// TODO: no garbage collection for this?
		id: string,
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

		const eqParent = document.querySelector(`#${id}-equalizer`);
		if (eqParent) eqParent.append(container);
	};
	return (
		<Box
			round="small"
			maxWidth="50em"
			border={{ color: generateHexColorFromString(id), size: "medium" }}
		>
			<Text color={generateHexColorFromString(id)}>{username}</Text>
			{stream.getVideoTracks().length === 0
				? (
						<>
							<video
								autoPlay={true}
								muted={isMuted}
								style="display:none"
								ref={player}
							/>
							<Box
								id={`${id}-equalizer`}
								style={{ width: "10em", height: "10em" }}
							/>
						</>
					)
				: (
						<>
							<video autoPlay={true} muted={isMuted} ref={player} />
						</>
					)}
		</Box>
	);
}