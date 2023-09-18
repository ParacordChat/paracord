import shortid from "shortid";
import { Room, selfId } from "trystero";
import { Message } from "../helpers/types";
import { useMessageStore } from "../stateManagers/messageStore";
import { useClientSideUserTraits } from "../stateManagers/userManagers/clientSideUserTraits";
import { useUserStore } from "../stateManagers/userManagers/userStore";

export default class ChatManager {
  private sendChatAction: (
    data: string,
    ids?: string | string[]
  ) => Promise<any[]>;
  private sendTyping: (
    data: boolean,
    ids?: string | string[]
  ) => Promise<any[]>;
  private roomId: string;

  constructor({ room, roomId }: { room: Room; roomId: string }) {
    const [sendChatAction, getChatAction] = room.makeAction("chat");
    const [sendTyping, getTyping] = room.makeAction("isTyping");
    this.sendChatAction = sendChatAction;
    this.sendTyping = sendTyping;
    this.roomId = roomId;

    getChatAction(async (rawData, id) => {
      const data = JSON.parse(rawData);
      console.log(data);
      if (
        data &&
        data.text.trim() !== "" &&
        useClientSideUserTraits.getState().mutedUsers[id] !== true
      ) {
        const newMessage: Message = {
          id: data.id,
          text: data.text,
          sentAt: data.sentAt,
          sentBy: id,
          recievedAt: Date.now(),
          roomId: data.roomId,
        };
        useMessageStore.getState().addMessage(newMessage);
      }
    });

    getTyping((data, id) => {
      if (data === true) useClientSideUserTraits.getState().addTypingUser(id);
      else useClientSideUserTraits.getState().removeTypingUser(id);
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
      roomId: this.roomId,
    };
    const msgString = JSON.stringify(newMessage);
    const users = useUserStore
      .getState()
      .users.filter((user) => {
        return user.roomId === this.roomId && user.active;
      })
      .map((user) => user.id);

    this.sendTypingIndicator(false);
    this.sendChatAction(msgString, users).then((x) => console.log(x));

    useMessageStore.getState().addMessage(newMessage);
  };

  sendTypingIndicator = (isTyping: boolean) => {
    this.sendTyping(isTyping);
  };
}
