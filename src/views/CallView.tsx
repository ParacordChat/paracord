/* eslint-disable jsx-a11y/media-has-caption */
import { funAnimalName } from "fun-animal-names";
import { Box, Button, Footer, Text } from "grommet";
import { Camera, Close, Monitor, Phone, View } from "grommet-icons";
import { useState } from "preact/hooks";
import { selfId } from "../Distra";
import RTCManager from "../DistraManagers/callManager";
import StreamPlayer from "../helpers/components/StreamPlayer";
import { generateHexColorFromString } from "../helpers/helpers";
import { useCallPrefsState } from "../stateManagers/commsManagers/personalCallPrefs";
import { useUserStore } from "../stateManagers/userManagers/userStore";

export function CallView(props: { rtcManagerInstance: RTCManager }) {
	const { rtcManagerInstance } = props;

	const [myStream, setMyStream] = useState<MediaStream | null>(null);

	const userNames = useUserStore(
		(
			state // TODO: this may not update w/ new users
		) =>
			state.users.map((p) => {
				return { id: p.id, name: p.name };
			})
	);

	const uiInteractive = useUserStore((state) =>
		state.users.some((p) => p.active)
	);

	const callConsent = useCallPrefsState((state) => state.callConsent);
	const isSharing = useCallPrefsState((state) => state.isSharing);
	const videoBubbles = useCallPrefsState((state) => state.videoBubbles);

	return (
		<>
			<div style={{ height: "100%", overflow: "scroll" }}>
				<Box>
					{callConsent && (
						<Box fill="vertical" overflow="scroll">
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
				</Box>
				<Footer
					style={{
						position: "fixed",
						bottom: "0",
						width: "100%"
					}}
					direction="row"
					round="small"
					background="brand"
					pad="medium"
				>
					{isSharing ? (
						<Button
							onClick={() =>
								rtcManagerInstance.shareMedia(
									"cutStream",
									myStream,
									setMyStream
								)
							}
							hoverIndicator
							icon={<Close />}
							label="Leave Call"
						/>
					) : (
						<Box gap="small">
							<Button
								disabled={!uiInteractive}
								onClick={() =>
									rtcManagerInstance.shareMedia("phone", myStream, setMyStream)
								}
								hoverIndicator
								icon={<Phone />}
								label="Audio Only"
							/>
							<Button
								disabled={!uiInteractive}
								onClick={() =>
									rtcManagerInstance.shareMedia("video", myStream, setMyStream)
								}
								hoverIndicator
								icon={<Camera />}
								label="Camera"
							/>
							<Button
								disabled={!uiInteractive}
								onClick={() =>
									rtcManagerInstance.shareMedia("screen", myStream, setMyStream)
								}
								hoverIndicator
								icon={<Monitor />}
								label="Desktop share"
							/>
							<Button
								disabled={!uiInteractive}
								onClick={() =>
									rtcManagerInstance.shareMedia("view", myStream, setMyStream)
								}
								hoverIndicator
								icon={<View />}
								label="View"
							/>
						</Box>
					)}
				</Footer>
			</div>
		</>
	);
}
