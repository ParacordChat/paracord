import {
	Anchor,
	Box,
	Button,
	CheckBox,
	Footer,
	Text,
	TextInput
} from "grommet";
import { Login, Organization, Risk } from "grommet-icons";
import { route } from "preact-router";
import { useRef, useState } from "preact/hooks";
import packageJson from "../../../package.json";
import GenericHeader from "../../helpers/components/GenericHeader";
import { genId } from "../../helpers/utils";

export function RoomCreator() {
	const [usePassword, setUsePassword] = useState(true);
	const roomRef = useRef<HTMLInputElement>(null);
	const loadRoom = () =>
		route(`/${usePassword ? "s" : "p"}/${roomRef.current?.value}`, true);
	return (
		<>
			<GenericHeader>
				<Box direction="column" style={{ textAlign:"center", paddingBottom:"3em" }}>
					<Text size="large" color="#FFFC00">
						The ghost keeps your messages. <a href="https://www.nytimes.com/2014/05/09/technology/snapchat-reaches-settlement-with-federal-trade-commission.html?_r=0">Forever</a>.
					</Text>
					<Text size="large" color="#7289da">
						Same goes for a certain purple... <a href="https://www.reddit.com/r/privacy/comments/jy14qi/psa_discord_lies_about_removing_deleted_files/">creature</a>.
					</Text>
					<Text size="large">
						Want privacy? Choose <b style={{ color:"#4bffac" }}>Para</b><b style={{ color:"#af79ff" }}>cord</b>.
					</Text>
					<Text size="small">
						There in seconds, gone in seconds. Always yours.
					</Text>
				</Box>
				

				<Box border={{ color: "brand", size: "large" }} pad="medium">
					<Text size="medium">
						Create a room:
					</Text>
					<Box direction="row">
						<TextInput
							border={{ color: "brand", size: "small" }}
							ref={roomRef}
							name="userInput"
							autoComplete="off"
							icon={<Login />}
							placeholder="Room ID"
							onKeyUp={(e: { key: string }) => {
								if (e.key === "Enter") {
									loadRoom();
								}
							}}
						/>
						<Button
							icon={<Risk />}
							onClick={() =>
								roomRef.current && (roomRef.current.value = genId(6))
							}
							label="Random"
						/>
					</Box>
					<Box direction="row">
						<CheckBox
							pad="small"
							checked={usePassword}
							label="Use Password?"
							color="brand"
							onChange={(event: {
              target: {
                checked: boolean | ((prevState: boolean) => boolean);
              };
            }) => setUsePassword(event.target.checked)}
						/>
					</Box>
					<Button
						onClick={loadRoom}
						label="Go"
						primary
					/>
				</Box>
				<Button
					icon={<Organization />}
					style={{ color: "#4bffac" }}
					onClick={() => route("/Enterprise", true)}
					label="Learn about Paracord for your business"
					size="small"
				/>
			</GenericHeader>


			<Footer
				background="brand"
				pad="medium"
				style={{ position: "absolute", bottom: 0, width: "100%" }}
			>
				<Text>Copyright 2023 Paracord</Text>
				<Text size="xsmall">Version: {packageJson.version}</Text>
				<Anchor
					label="Desktop App(Beta)"
					onClick={() => {
						window.location.href =
              "https://github.com/ParacordChat/paracord/releases/tag/allplatforms";
					}}
				/>
				<Anchor
					label="About"
					onClick={() => {
						route(`/About`, true);
					}}
				/>
			</Footer>
		</>
	);
}
