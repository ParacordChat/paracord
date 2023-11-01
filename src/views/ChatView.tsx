import { Box, Button, TextArea } from "grommet";
import { FormDown, FormUp, Send } from "grommet-icons";
import { useRef, useState } from "preact/hooks";
import ChatManager from "../DistraManagers/chatManager";
import { useUserStore } from "../stateManagers/userManagers/userStore";
import Messages from "./Messages";

export function ChatView(props: { chatManagerInstance: ChatManager }) {
	const { chatManagerInstance } = props;
	const messageBox = useRef<HTMLTextAreaElement>(null);
	const [multilineInput, setMultilineInput] = useState(false);
	const [messageValue, setMessageValue] = useState("");
	const uiInteractive = useUserStore((state) =>
		state.users.some((p) => p.active)
	);

	const sendMessage = () => {
		if (messageBox.current !== null && chatManagerInstance) {
			chatManagerInstance.sendChat(messageValue);
			setMessageValue("");
			messageBox.current.value = "";
		}
	};

	return (
		<>
			<Messages />
			<Box direction="row">
				<Button
					icon={multilineInput ? <FormDown /> : <FormUp />}
					onClick={() => setMultilineInput(!multilineInput)}
					disabled={!uiInteractive}
					tip="Toggle multiline input"
				/>
				<TextArea
					ref={messageBox}
					id="userTextBox"
					style={{ resize: "none" }}
					rows={multilineInput ? 5 : 1}
					name="userInput"
					autoComplete="off"
					placeholder="Type your message"
					disabled={!uiInteractive}
					value={messageValue}
					onChange={(e: { target: { value: string } }) =>
						setMessageValue(e.target.value)
					}
					onKeyUp={(e: { key: string; shiftKey: boolean }) => {
						if (e.key === "Enter" && e.shiftKey === false && !multilineInput) {
							sendMessage();
						} else {
							chatManagerInstance.sendTypingIndicator(true);
						}
					}}
					onBlur={() => chatManagerInstance.sendTypingIndicator(false)}
				/>
				<Button
					onClick={sendMessage}
					disabled={!uiInteractive}
					primary
					hoverIndicator
					tip="Send message"
					icon={<Send />}
				/>
			</Box>
		</>
	);
}
