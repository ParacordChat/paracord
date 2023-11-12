import { Box } from "grommet";
import { Chat, Download, Phone, SettingsOption } from "grommet-icons";
import { useEffect, useMemo } from "preact/hooks";
import { Room } from "../../Distra";
import CallManager from "../../DistraManagers/callManager";
import ChatManager from "../../DistraManagers/chatManager";
import DownloadManager from "../../DistraManagers/downloadManager";
import UserManager from "../../DistraManagers/userManager";
import TabBar from "../../helpers/components/tabbedview/TabBar";
import TabViewport from "../../helpers/components/tabbedview/TabViewport";
import { RoomCard } from "./RoomCard";
import { UserView } from "./UserView";
import { CallView } from "./panes/CallView";
import { ChatView } from "./panes/ChatView";
import { DownloadView } from "./panes/DownloadView";
import { SettingsView } from "./panes/SettingsView";

const MainModal = ({ roomId, room }: { roomId: string; room: Room }) => {
	const userManagerInstance = useMemo(
		() =>
			new UserManager({
				room,
				roomId
			}),
		[room, roomId]
	);

	const chatManagerInstance = useMemo(
		() =>
			new ChatManager({
				room,
				roomId
			}),
		[room, roomId]
	);

	const downloadManagerInstance = useMemo(
		() =>
			new DownloadManager({
				room,
				roomId
			}),
		[room, roomId]
	);

	const callManagerInstance = useMemo(
		() =>
			new CallManager({
				room,
				roomId
			}),
		[room, roomId]
	);

	useEffect(() => {
		userManagerInstance.createPersona();
		room.onPeerJoin(async (peerId) =>
			userManagerInstance
				.peerJoinHook(peerId)
				.then(() => downloadManagerInstance.peerJoinHook(peerId))
		);
	}, [downloadManagerInstance, room, userManagerInstance]);

	return (
		<>
			<RoomCard roomId={roomId}>
				<TabBar
					tabs={[
						{ label: "chat", icon: <Chat /> },

						{ label: "downloads", icon: <Download /> },

						{ label: "call", icon: <Phone /> },

						{ label: "settings", icon: <SettingsOption /> }
					]}
				/>
			</RoomCard>
			<Box direction="row">
				<Box fill={true}>
					<TabViewport
						tabs={{
							chat: <ChatView chatManagerInstance={chatManagerInstance} />,
							downloads: (
								<DownloadView
									downloadManagerInstance={downloadManagerInstance}
								/>
							),
							call: <CallView callManagerInstance={callManagerInstance} />,
							settings: <SettingsView />
						}}
					/>
				</Box>
				<UserView roomId={roomId} userManagerInstance={userManagerInstance} />
			</Box>
		</>
	);
};

export default MainModal;
