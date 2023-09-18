import * as Tabs from "@radix-ui/react-tabs";
import { Button, Footer } from "grommet";
import { Chat, Download } from "grommet-icons";
import { useEffect, useState } from "preact/hooks";
import { Room } from "trystero";
import ChatManager from "./TrysteroManagers/chatManager";
import DownloadManager from "./TrysteroManagers/downloadManager";
import UserManager from "./TrysteroManagers/userManager";
import "./assets/App.css";
import { ChatView } from "./views/ChatView";
import { DownloadView } from "./views/DownloadView";
import { RoomCard } from "./views/RoomCard";
import { UserView } from "./views/UserView";

function MainModal(props: {
  room: Room;
  roomId: string;
  leaveRoom: () => void;
}) {
  const { room, roomId, leaveRoom } = props;

  const [userManagerInstance] = useState(
    new UserManager({
      room,
      roomId,
    })
  );

  const [chatManagerInstance] = useState(
    new ChatManager({
      room,
      roomId,
    })
  );

  const [downloadManagerInstance] = useState(
    new DownloadManager({
      room,
      roomId,
    })
  );

  useEffect(() => {
    userManagerInstance.createPersona();
  }, []);

  //TODO: revamp, merge dl/chat, highlight does not change, but it'll be gutted so...

  return (
    <>
      <RoomCard roomId={roomId} leaveRoom={leaveRoom} />
      <Tabs.Root defaultValue="tab1">
        <div className="horizontal">
          <div style={{ width: "80%", height: "100%" }}>
            <Tabs.Content value="tab1">
              <ChatView chatManagerInstance={chatManagerInstance} />
            </Tabs.Content>
            <Tabs.Content value="tab2">
              <DownloadView downloadManagerInstance={downloadManagerInstance} />
            </Tabs.Content>
          </div>
          <UserView roomId={roomId} userManagerInstance={userManagerInstance} />
        </div>
        <Footer
          style={{
            paddingTop: "0",
            paddingBottom: "0",
            justifyContent: "center",
          }}
          align="center"
          direction="row"
          background="accent-1"
          pad="medium"
        >
          <Tabs.List aria-label="tabs">
            <Tabs.Trigger className="tabbutton" value="tab1" title="Chat">
              <Button icon={<Chat />} primary />
            </Tabs.Trigger>
            <Tabs.Trigger className="tabbutton" value="tab2" title="Downloads">
              <Button icon={<Download />} />
            </Tabs.Trigger>
          </Tabs.List>
        </Footer>
      </Tabs.Root>
    </>
  );
}

export default MainModal;
