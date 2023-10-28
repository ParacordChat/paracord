import {
	Anchor,
	Box,
	Button,
	CheckBox,
	Footer,
	Text,
	TextInput
} from "grommet";
import { Login, Risk } from "grommet-icons";
import { route } from "preact-router";
import { useRef, useState } from "preact/hooks";
import packageJson from "../../package.json";
import GenericHeader from "../helpers/components/GenericHeader";
import { genId } from "../helpers/utils";

export function RoomCreator() {
	const [usePassword, setUsePassword] = useState(true);
	const roomRef = useRef<HTMLInputElement>(null);
	return (
		<>
			<GenericHeader>
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
								route(
									`/${roomRef.current?.value}/${usePassword ? "a" : ""}`,
									true
								);
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
					onClick={() =>
						route(`/${usePassword ? "s" : "p"}/${roomRef.current?.value}`, true)
					}
					label="Go"
					primary
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
					label="Desktop App"
					onClick={() => {
						window.location.href = "https://github.com/ParacordChat/paracord/releases/tag/allplatforms";
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
