import { create } from "zustand";
import { Message } from "../../helpers/types/types";

interface MessageStore {
  messages: Message[];
  addMessage: (message: Message, maxLen?: number) => void;
  deleteMessagesBefore: (roomId: string, before: number) => void;
}

export const useMessageStore = create<MessageStore>((set) => ({
	messages: [],
	addMessage: (message: Message, maxLen?: number) =>
		set((state) => {
			if (maxLen && maxLen !== 0 && state.messages.length >= maxLen) {
				return { messages: [...state.messages.slice(1), message] };
			}
			return { messages: [...state.messages, message] };
		}),
	deleteMessagesBefore: (roomId: string, before: number) =>
		set((state) => ({
			messages: state.messages.filter(
				(message) => message.roomId !== roomId && message.recievedAt > before
			)
		}))
}));
