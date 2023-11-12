/* eslint-disable jsx-a11y/media-has-caption */
import AudioMotionAnalyzer from "audiomotion-analyzer";
import { Box, Button, Text } from "grommet";
import { View, Volume, VolumeMute } from "grommet-icons";
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState
} from "preact/hooks";
import { generateHexColorFromString } from "../helpers";
import { selfId } from "../utils";

export default function StreamPlayer({
	stream,
	username,
	id
}: {
  stream: MediaStream|undefined;
  username: string;
  id: string;
}) {
	const player = useRef<HTMLVideoElement>(null);
	const eqContainer = useRef<HTMLDivElement>(null);
	const [internalMute, setInternalMute] = useState<boolean>(false);
	const isSelf = useMemo(() => id === selfId, [id]);

	const deployEqualizer = useCallback((mediaStream: MediaStream) => {
		if (!eqContainer.current) return;
		const container = document.createElement("div");
		container.style.width = "100%";
		container.style.height = "100%";

		const audioMotion = new AudioMotionAnalyzer(container, {
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

		eqContainer.current.innerHTML = "";
		eqContainer.current.append(container);
	}, []);

	useEffect(() => {
		if(!stream) return;
		if (player.current) {
			player.current.srcObject = stream;
		}
		if (
			stream.getVideoTracks()?.length === 0 &&
      stream.getAudioTracks()?.length > 0
		) {
			deployEqualizer(stream);
		}
	}, [player, stream, id, deployEqualizer]);

	return (
		<Box
			round="small"
			border={{ color: generateHexColorFromString(id), size: "medium" }}
			className="handle"
			style={{
				height: "40vh",
				width: "60vh",
				resize: "both",
				overflow: "hidden"
			}}
		>
			<Text color={generateHexColorFromString(id)}>
				{username}
				{!isSelf||!stream && (
					<Button
						onClick={() => setInternalMute((muted) => !muted)}
						icon={
							internalMute ? (
								<VolumeMute color="red" size="small" />
							) : (
								<Volume color="green" size="small" />
							)
						}
					/>
				)}
			</Text>

			{stream?(stream.getVideoTracks()?.length === 0 ? (
				<>
					<video autoPlay muted={internalMute || isSelf} hidden ref={player} />
					<Box ref={eqContainer} />
				</>
			) : (
				<video autoPlay muted={internalMute || isSelf} ref={player} />
			)):(
				<Box align="center">
					<View size="xlarge" />
				</Box>
			)}
		</Box>
	);
}
