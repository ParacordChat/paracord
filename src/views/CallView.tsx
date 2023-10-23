/* eslint-disable jsx-a11y/media-has-caption */
import { funAnimalName } from "fun-animal-names";
import { Box, Button, Footer, Text } from "grommet";
import { Camera, Close, Monitor, Phone, View } from "grommet-icons";
import { selfId } from "../Distra";
import RTCManager from "../DistraManagers/callManager";
import StreamPlayer from "../helpers/components/StreamPlayer";
import { generateHexColorFromString } from "../helpers/helpers";
import { useCallPrefsState } from "../stateManagers/RTCManagers/personalCallPrefs";
import { useUserStore } from "../stateManagers/userManagers/userStore";

export function CallView(props: { rtcManagerInstance: RTCManager }) {
	const { rtcManagerInstance } = props;

	const userNames = useUserStore((state) =>
		state.users.map((p) => {
			return { id: p.id, name: p.name };
		})
	);

	const uiInteractive = useUserStore((state) =>
		state.users.some((p) => p.active)
	);

	const callConsent = useCallPrefsState((state) => state.callConsent);
	const myStream = useCallPrefsState((state) => state.myStream);
	const isSharing = useCallPrefsState((state) => state.isSharing);
	const videoBubbles = useCallPrefsState((state) => state.videoBubbles);

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
									rtcManagerInstance
										.shareMedia("cutStream")
										.then(() =>
											useCallPrefsState.getState()
												.setIsSharing(false)
										);
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
										rtcManagerInstance
											.shareMedia("phone")
											.then(() =>
												useCallPrefsState.getState()
													.setIsSharing(true)
											);
									}}
									hoverIndicator
									icon={<Phone />}
									label="Audio Only"
								/>
								<Button
									disabled={!uiInteractive}
									onClick={() => {
										rtcManagerInstance
											.shareMedia("video")
											.then(() =>
												useCallPrefsState.getState()
													.setIsSharing(true)
											);
									}}
									hoverIndicator
									icon={<Camera />}
									label="Camera"
								/>
								<Button
									disabled={!uiInteractive}
									onClick={() => {
										rtcManagerInstance
											.shareMedia("screen")
											.then(() =>
												useCallPrefsState.getState()
													.setIsSharing(true)
											);
									}}
									hoverIndicator
									icon={<Monitor />}
									label="Desktop share"
								/>
								<Button
									disabled={!uiInteractive}
									onClick={() => {
										rtcManagerInstance
											.shareMedia("view")
											.then(() =>
												useCallPrefsState.getState()
													.setIsSharing(true)
											);
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