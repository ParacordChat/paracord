/* eslint-disable multiline-ternary */
import DOMPurify from "dompurify";
import { Box, Button, Text } from "grommet";
import { Return } from "grommet-icons";
import { useEffect, useRef } from "preact/hooks";
import { generateHexColorFromString } from "../helpers";
import { Message } from "../types/types";

const formatMessage = (message: string) => {
	const replyRegex = />>(.{9})/gi;

	const linkRegex =
    /(https?:\/\/(www\.)?[\w#%+.:=@~-]{1,256}\.[\d()a-z]{1,6}\b([\w#%&()+./:=?@~-]*))/gi;

	message = message.replaceAll(
		linkRegex,
		`<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>`
	);
	message = message.replaceAll(
		replyRegex,
		`<a class="msgLink $1">&gt;&gt;$1</a>`
	);

	return message;
};

const getTimeElapsed = (receivedAt: number) => {
	const now = Date.now();
	const secondsElapsed = Math.floor((now - receivedAt) / 1000);
	if (secondsElapsed < 60) {
		return `${secondsElapsed} seconds ago`;
	} else if (secondsElapsed < 3600) {
		const minutesElapsed = Math.floor(secondsElapsed / 60);
		return `${minutesElapsed} minute${minutesElapsed > 1 ? "s" : ""} ago`;
	} else if (secondsElapsed < 86_400) {
		const hoursElapsed = Math.floor(secondsElapsed / 3600);
		return `${hoursElapsed} hour${hoursElapsed > 1 ? "s" : ""} ago`;
	} else {
		const daysElapsed = Math.floor(secondsElapsed / 86_400);
		return `${daysElapsed} day${daysElapsed > 1 ? "s" : ""} ago`;
	}
};

export default function RenderMessage(props: {
  message: Message;
  sentByName: string;
  index: number;
  isLast: boolean;
}) {
	const { message, index, isLast, sentByName } = props;
	const lastMessage = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (isLast && lastMessage.current) {
			lastMessage.current.scrollIntoView({
				behavior: "smooth",
				block: "center"
			});
		}
		for (const element of document.querySelectorAll(".msgLink")) {
			element.setAttribute("cursor", "pointer");
			element.addEventListener("click", (e) => {
				const id = (e.target as HTMLAnchorElement).className.split(" ")[1];
				const msg = document.querySelector(`#${id}`);
				if (msg) msg.scrollIntoView({ behavior: "smooth", block: "center" });
			});
		}
	});
	return (
		<>
			{message.sentBy === "system" ? (
				<div>
					<Box
						key={index}
						border={{ color: "grey", size: "small" }}
						pad="medium"
						round="small"
					>
						{message.text}
						<Text style={{ color: "grey" }}>
							{getTimeElapsed(message.recievedAt)}
						</Text>
					</Box>
				</div>
			) : (
				<>
					<div
						key={message.id}
						id={message.id}
						ref={isLast ? lastMessage : null}
						style={{
							textAlign: "left",
							backgroundColor: "dark-1"
							// WARN: this must remain a div due to css overrides
						}}
					>
						<Box direction="row">
							<Text
								size="Medium"
								style={{
									fontWeight: "bold",
									color: generateHexColorFromString(message.sentBy)
								}}
							>
								{sentByName}
							</Text>
							<Text
								size="small"
								style={{
									paddingLeft: "1vh",
									color: "grey"
								}}
							>
								{getTimeElapsed(message.recievedAt)}
							</Text>
							<Button
								style={{
									paddingLeft: "1vh",
									cursor: "pointer"
								}}
								icon={<Return />}
								onClick={() => {
									const textBox = document.querySelector(
										"#userTextBox"
									) as HTMLFormElement;
									if (textBox) textBox.value += `>>${message.id} `;
								}}
							/>
						</Box>
						<Text
							style={{ width: "fit-content" }}
							size="medium"
							dangerouslySetInnerHTML={{
								__html: DOMPurify.sanitize(formatMessage(message.text))
							}}
						/>
					</div>
				</>
			)}
		</>
	);
}
