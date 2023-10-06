import * as Tabs from "@radix-ui/react-tabs";
import { Box, Button } from "grommet";
import { Chat, Download, Phone, SettingsOption } from "grommet-icons";
import { useEffect, useState } from "preact/hooks";
import { Room } from "trystero";
import RTCManager from "./TrysteroManagers/RTCManager";
import ChatManager from "./TrysteroManagers/chatManager";
import DownloadManager from "./TrysteroManagers/downloadManager";
import UserManager from "./TrysteroManagers/userManager";
import { CallView } from "./views/CallView";
import { ChatView } from "./views/ChatView";
import { DownloadView } from "./views/DownloadView";
import { RoomCard } from "./views/RoomCard";
import { SettingsView } from "./views/SettingsView";
import { UserView } from "./views/UserView";

const MainModal = ({ roomId, room }: { roomId: string; room: Room }) => {
	const [userManagerInstance] = useState(
		new UserManager({
			room,
			roomId
		})
	);

	const [chatManagerInstance] = useState(
		new ChatManager({
			room,
			roomId
		})
	);

	const [downloadManagerInstance] = useState(
		new DownloadManager({
			room,
			roomId
		})
	);

	const [rtcManagerInstance] = useState(
		new RTCManager({
			room,
			roomId
		})
	);

	useEffect(() => {
		userManagerInstance.createPersona();
		room.onPeerJoin((peerId) => {
			userManagerInstance.peerJoinHook(peerId);
			downloadManagerInstance.peerJoinHook(peerId);
		});
	}, [downloadManagerInstance, room, userManagerInstance]);

	return (
		<>
			<Tabs.Root defaultValue="tab1">
				<RoomCard roomId={roomId}>
					<Tabs.List aria-label="tabs">
						<Tabs.Trigger
							style={{
								background: "transparent",
								border: "none"
							}}
							value="tab1"
							title="Chat"
						>
							<Button primary icon={<Chat />} />
						</Tabs.Trigger>
						<Tabs.Trigger
							style={{
								background: "transparent",
								border: "none"
							}}
							value="tab2"
							title="Downloads"
						>
							<Button primary background="brand" icon={<Download />} />
						</Tabs.Trigger>

						<Tabs.Trigger
							style={{
								background: "transparent",
								border: "none"
							}}
							value="tab3"
							title="Call"
						>
							<Button primary background="brand" icon={<Phone />} />
						</Tabs.Trigger>
						<Tabs.Trigger
							style={{
								background: "transparent",
								border: "none"
							}}
							value="tab4"
							title="Chat"
						>
							<Button primary icon={<SettingsOption />} />
						</Tabs.Trigger>
					</Tabs.List>
				</RoomCard>
				<Box direction="row">
					<Box fill={true}>
						<Tabs.Content value="tab1">
							<ChatView chatManagerInstance={chatManagerInstance} />
						</Tabs.Content>
						<Tabs.Content value="tab2">
							<DownloadView downloadManagerInstance={downloadManagerInstance} />
						</Tabs.Content>
						<Tabs.Content value="tab3">
							<CallView rtcManagerInstance={rtcManagerInstance} />
						</Tabs.Content>
						<Tabs.Content value="tab4">
							<SettingsView />
						</Tabs.Content>
					</Box>
					<UserView roomId={roomId} userManagerInstance={userManagerInstance} />
				</Box>
			</Tabs.Root>
		</>
	);
};

export default MainModal;
