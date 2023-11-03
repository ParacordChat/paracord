import { InfiniteScroll, Main } from "grommet";
import { selfId } from "../../Distra";
import RenderMessage from "../../helpers/components/RenderMessage";
import { Message, Persona } from "../../helpers/types/types";
import { useMessageStore } from "../../stateManagers/commsManagers/messageStore";
import { usePersonaStore } from "../../stateManagers/userManagers/personaStore";
import { useUserStore } from "../../stateManagers/userManagers/userStore";

export default function Messages() {
	const messageQueue = useMessageStore(
		(store: { messages: Message[] }) => store.messages
	);
	const yourName = usePersonaStore(
		(state: { persona: Persona }) => state.persona.name
	);

	return (
	// TODO: fix mbox vert fill and vchat vert fill
		<Main
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
				height: "90%"
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
		</Main>
	);
}
