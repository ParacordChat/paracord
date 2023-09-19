import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Box } from "grommet";
import { selfId } from "trystero";
import { Message, Persona } from "../helpers/types";
import { useMessageStore } from "../stateManagers/messageStore";
import { usePersonaStore } from "../stateManagers/userManagers/personaStore";
import { useUserStore } from "../stateManagers/userManagers/userStore";
import RenderMessage from "./helpers/RenderMessage";

dayjs.extend(relativeTime);

export default function Messages() {
  const messageQueue = useMessageStore(
    (store: { messages: Message[] }) => store.messages
  );
  const yourName = usePersonaStore(
    (state: { persona: Persona }) => state.persona.name
  );

  //TODO: infinite scroll, get scroll posn and request more messages if 100 from top
  return (
    <Box
      direction="column"
      border={{ color: "brand", size: "small" }}
      pad="small"
      round="small"
      style={{
        whiteSpace: "pre-line",
        //fill space with height
        overflow: "scroll",

        height: "32em",
      }}
      background="dark-1"
    >
      {messageQueue
        .sort((a, b) => a.recievedAt - b.recievedAt)
        .map((message, index) => (
          <RenderMessage
            message={message}
            index={index}
            sentByName={
              message.sentBy === selfId
                ? yourName
                : useUserStore((state) =>
                    state.users.find((user) => user.id === message.sentBy)
                  )?.name || message.sentBy
            }
            isLast={index === messageQueue.length - 1}
          />
        ))}
    </Box>
  );
}
