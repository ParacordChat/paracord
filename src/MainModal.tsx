/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react/display-name */
import * as Tabs from "@radix-ui/react-tabs";
import { Box, Button, Footer } from "grommet";
import { Chat, Download } from "grommet-icons";
import { useEffect, useState } from "preact/hooks";
import { Room } from "trystero";
import ChatManager from "./TrysteroManagers/chatManager";
import DownloadManager from "./TrysteroManagers/downloadManager";
import UserManager from "./TrysteroManagers/userManager";
import { ChatView } from "./views/ChatView";
import { DownloadView } from "./views/DownloadView";
import { RoomCard } from "./views/RoomCard";
import { UserView } from "./views/UserView";

const MainModal = (roomId: string, room: Room) => () => {
	console.log(roomId, room);

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

	useEffect(() => {
		userManagerInstance.createPersona();
	}, [userManagerInstance]);

	return (
		<>
			<RoomCard roomId={roomId} />
			<Tabs.Root defaultValue="tab1">
				<Box direction="row">
					<Box fill="true">
						<Tabs.Content value="tab1">
							<ChatView chatManagerInstance={chatManagerInstance} />
						</Tabs.Content>
						<Tabs.Content value="tab2">
							<DownloadView downloadManagerInstance={downloadManagerInstance} />
						</Tabs.Content>
					</Box>
					<UserView roomId={roomId} userManagerInstance={userManagerInstance} />
				</Box>
				<Footer
					style={{
						paddingTop: "0",
						paddingBottom: "0",
						justifyContent: "center"
					}}
					align="center"
					direction="row"
					background="accent-1"
					pad="medium"
				>
					<Tabs.List aria-label="tabs">
						<Tabs.Trigger
							style={{
								padding: "0.5em",
								margin: "0.5em"
							}}
							value="tab1"
							title="Chat"
						>
							<Button icon={<Chat />} />
						</Tabs.Trigger>
						<Tabs.Trigger
							style={{
								padding: "0.5em",
								margin: "0.5em"
							}}
							value="tab2"
							title="Downloads"
						>
							<Button icon={<Download />} />
						</Tabs.Trigger>
					</Tabs.List>
				</Footer>
			</Tabs.Root>
		</>
	);
};

export default MainModal;
