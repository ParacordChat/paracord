import { create } from "zustand";
import { Message } from "../helpers/types";

interface MessageStore {
  messages: Message[];
  addMessage: (message: Message) => void;
  deleteMessagesBefore: (roomId: string, before: number) => void;
}

export const useMessageStore = create<MessageStore>((set) => ({
  messages: [],
  addMessage: (message: Message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  deleteMessagesBefore: (roomId: string, before: number) =>
    set((state) => ({
      messages: state.messages.filter(
        (message) => message.roomId !== roomId && message.recievedAt > before
      ),
    })),
}));
