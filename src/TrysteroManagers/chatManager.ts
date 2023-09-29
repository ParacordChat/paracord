import shortid from "shortid";
import { Room, selfId } from "trystero";
import { Message } from "../helpers/types";
import { useMessageStore } from "../stateManagers/messageStore";
import { useClientSideUserTraits } from "../stateManagers/userManagers/clientSideUserTraits";
import { useUserStore } from "../stateManagers/userManagers/userStore";

export default class ChatManager {
	private sendChatAction: (
		data: Message,
		ids?: string | string[]
	) => Promise<any[]>;
	private sendTyping: (
		data: boolean,
		ids?: string | string[]
	) => Promise<any[]>;
	private roomId: string;

	constructor({ room, roomId }: { room: Room; roomId: string }) {
		const [sendChatAction, getChatAction] = room.makeAction<Message>(
			"chat",
			true
		);
		const [sendTyping, getTyping] = room.makeAction<boolean>("isTyping", true);
		this.sendChatAction = sendChatAction;
		this.sendTyping = sendTyping;
		this.roomId = roomId;

		getChatAction(async (chatData, id) => {
			if (useClientSideUserTraits.getState().mutedUsers[id] !== true) {
				const newMessage: Message = {
					id: chatData.id,
					text: chatData.text,
					sentAt: chatData.sentAt,
					sentBy: id,
					recievedAt: Date.now(),
					roomId: chatData.roomId
				};
				useMessageStore.getState()
					.addMessage(newMessage);
			}
		});

		getTyping((data, id) => {
			if (data === true) useClientSideUserTraits.getState()
				.addTypingUser(id);
			else useClientSideUserTraits.getState()
				.removeTypingUser(id);
		});
	}

	sendChat = async (message: string) => {
		if (message.trim() === "" || this.roomId.trim() === "") return;
		const newMessage: Message = {
			sentBy: selfId,
			id: shortid.generate(),
			text: message,
			sentAt: Date.now(),
			recievedAt: Date.now(),
			roomId: this.roomId
		};
		const users = useUserStore
			.getState()
			.users.filter((user) => {
				return user.roomId === this.roomId && user.active;
			})
			.map((user) => user.id);

		this.sendTypingIndicator(false);
		this.sendChatAction(newMessage, users);

		useMessageStore.getState()
			.addMessage(newMessage);
	};

	sendTypingIndicator = (isTyping: boolean) => {
		this.sendTyping(isTyping);
	};
}
