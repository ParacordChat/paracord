import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Box, InfiniteScroll } from "grommet";
import { selfId } from "../Distra";
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

	// TODO: make it truly lazyload(or, do we even need it?) https://v2.grommet.io/infinitescroll
	return (
		<Box
			direction="column"
			border={{ color: "brand", size: "small" }}
			pad="small"
			round="small"
			background="dark-1"
			style={{
				whiteSpace: "pre-line",
				// fill space with height
				overflowX: "auto",
				overflowY: "scroll",
				// overflow: "auto",
				height: "30em"
			}}
		>
			<InfiniteScroll
				items={messageQueue.sort((a, b) => a.recievedAt - b.recievedAt)}
			>
				{(message: Message, index: number) => (
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
				)}
			</InfiniteScroll>
		</Box>
	);
}
