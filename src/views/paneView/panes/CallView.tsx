/* eslint-disable jsx-a11y/media-has-caption */
import { funAnimalName } from "fun-animal-names";
import { Box, Button, Footer, Text } from "grommet";
import { Camera, Close, Monitor, Phone, View } from "grommet-icons";
import { VNode } from "preact";
import { useState } from "preact/hooks";
import { selfId } from "../../../Distra";
import CallManager, { RoomActionType } from "../../../DistraManagers/callManager";
import StreamPlayer from "../../../helpers/components/StreamPlayer";
import { generateHexColorFromString } from "../../../helpers/helpers";
import { useCallPrefsState } from "../../../stateManagers/commsManagers/personalCallPrefs";
import { useUserStore } from "../../../stateManagers/userManagers/userStore";

interface ButtonOption {
	label: RoomActionType;
	icon: VNode;
}

const buttonOptions:ButtonOption[] = [
	{ label: "phone", icon: <Phone /> },
	{ label: "video", icon: <Camera /> },
	{ label: "screen", icon: <Monitor /> },
	{ label: "view", icon: <View /> }
];

export function CallView(props: { callManagerInstance: CallManager }) {
	const { callManagerInstance } = props;

	const [myStream, setMyStream] = useState<MediaStream | undefined>(undefined);
	const [streamType, setStreamType] = useState<RoomActionType | null>(null);

	const userNames = useUserStore((state) =>state.users);

	const uiInteractive = useUserStore((state) =>
		state.users.some((p) => p.active)
	);

	const callConsent = useCallPrefsState((state) => state.callConsent);
	const isSharing = useCallPrefsState((state) => state.isSharing);
	const videoBubbles = useCallPrefsState((state) => state.videoBubbles);

	return (
		<>
			<div style={{ height: "75vh", overflow: "scroll" }}>
				<Box>
					{callConsent && (
						<Box fill="vertical">
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
									border={{
										color: generateHexColorFromString(selfId),
										size: "medium",
										width:"30vh"
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
					<Footer
						style={{
							position: "fixed",
							bottom: "0",
							width: "100%",
							height: "10vh"
						}}
						direction="row"
						round="small"
						background="brand"
						pad="medium"
					>
						{isSharing && (
							<Button
								onClick={() =>
									callManagerInstance.shareMedia(
										"cutStream",
										myStream
									)
										.then(()=>{
											setMyStream(undefined);
											setStreamType("cutStream");
										})
								}
								hoverIndicator
								icon={<Close />}
								tip="Leave Call"
							/>
						)}

						<div>
							{buttonOptions.map((entry, index) => (
								<Button
									key={index}
									disabled={!uiInteractive}
									className={entry.label === streamType ? "active" : ""}
									primary={entry.label === streamType}
									icon={entry.icon}
									tip={entry.label}
									onClick={() => 
										callManagerInstance.shareMedia(entry.label, myStream)
											.then((newStream)=>{
												setMyStream(newStream);
												setStreamType(entry.label);
											})
									}
								/>
							))}
						</div>
					</Footer>
				</Box>
				
			</div>
		</>
	);
}
