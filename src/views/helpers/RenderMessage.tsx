import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import DOMPurify from "dompurify";
import { Box, Button, Text } from "grommet";
import { Return } from "grommet-icons";
import { useEffect, useRef } from "preact/hooks";
import { generateHexColorFromString } from "../../helpers/helpers";
import { Message } from "../../helpers/types";

dayjs.extend(relativeTime);

const formatMessage = (message: string) => {
  const replyRegex = />>(.{9})/gi;

  const linkRegex =
    /(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*))/gi;

  message = message.replace(
    linkRegex,
    `<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>`
  );
  message = message.replace(replyRegex, `<a class="msgLink $1">&gt;&gt;$1</a>`);

  return message;
};

export default function RenderMessage(props: {
  message: Message;
  sentByName: string;
  index: number;
  isLast: boolean;
}) {
  const { message, index, isLast, sentByName } = props;
  console.log(message);
  const lastMessage = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isLast && lastMessage.current)
      lastMessage.current.scrollIntoView({ behavior: "smooth", block: "end" });
    Array.from(document.getElementsByClassName("msgLink")).forEach(
      (element) => {
        element.setAttribute("cursor", "pointer");
        element.addEventListener("click", (e) => {
          const id = (e.target as HTMLAnchorElement).className.split(" ")[1];
          const msg = document.getElementById(id);
          if (msg) msg.scrollIntoView({ behavior: "smooth", block: "center" });
        });
      }
    );
  });
  return (
    <>
      {message.sentBy === "system" ? (
        <Box
          key={index}
          className="filelistbox"
          border={{ color: "grey", size: "small" }}
          pad="medium"
          round="small"
        >
          {message.text}
          <Text style={{ color: "grey" }}>
            {dayjs().to(dayjs(message.recievedAt))}
          </Text>
        </Box>
      ) : (
        <>
          <Box
            direction="column"
            key={message.id}
            id={message.id}
            ref={isLast ? lastMessage : null}
            className={`tag is-medium filelistbox`}
            style={{
              backgroundColor: "var(--background-rgb)",
              color: "var(--foreground-rgb)",
              textAlign: "left",
              width: "fit-content",
              overflowY: "auto",
            }}
          >
            <Box direction="row">
              <Text
                size="Medium"
                style={{
                  fontWeight: "bold",
                  color: generateHexColorFromString(message.sentBy),
                }}
              >
                {sentByName}
              </Text>
              <Text
                size="small"
                style={{
                  paddingLeft: "1em",
                  color: "grey",
                }}
              >
                {dayjs().to(dayjs(message.recievedAt))}
              </Text>
              <Button
                style={{
                  paddingLeft: "1em",
                  cursor: "pointer",
                }}
                icon={<Return />}
                onClick={() => {
                  const textBox = document.getElementById(
                    "userTextBox"
                  ) as HTMLFormElement;
                  if (textBox) textBox.value += `>>${message.id} `;
                }}
              />
            </Box>
            <Text
              size="medium"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(formatMessage(message.text)),
              }}
            />
          </Box>
        </>
      )}
    </>
  );
}
