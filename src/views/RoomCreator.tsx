import {
	Anchor,
	Box,
	Button,
	CheckBox,
	Footer,
	Image,
	Main,
	Page,
	PageHeader,
	Text,
	TextInput
} from "grommet";
import { Login, Risk } from "grommet-icons";
import { route } from "preact-router";
import { useRef, useState } from "preact/hooks";
import shortid from "shortid";
import pcdLogo from "/logo.svg";

export function RoomCreator() {
	const [usePassword, setUsePassword] = useState(true);
	const roomRef = useRef<HTMLInputElement>(null);
	return (
		<>
			<Page kind="narrow">
				<PageHeader
					title="Paracord"
					subtitle="There in seconds, gone in seconds. Always yours."
					// parent={<Anchor label="Parent Page" />}
					actions={<Image style={{ height: "5em" }} src={pcdLogo} />}
				/>
				<Main pad="large">
					<Box
						direction="column"
						border={{ color: "brand", size: "large" }}
						pad="medium"
					>
						<Box direction="row">
							<TextInput
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
									roomRef.current &&
									(roomRef.current.value = shortid.generate())
								}
								label="Random"
							/>
						</Box>
						<Box direction="row">
							<CheckBox
								pad="small"
								checked={usePassword}
								label="Use Password?"
								onChange={(event: {
									target: {
										checked: boolean | ((prevState: boolean) => boolean);
									};
								}) => setUsePassword(event.target.checked)}
							/>
						</Box>
						<Button
							onClick={() =>
								route(
									`/${roomRef.current?.value}/${usePassword ? "a" : ""}`,
									true
								)
							}
							label="Go"
							primary
						/>
					</Box>
				</Main>
				<Footer background="brand" pad="medium">
					<Text>Copyright 2023 ParaCord</Text>
					<Anchor
						label="About"
						onClick={() => {
							route(`/About`, true);
						}}
					/>
				</Footer>
			</Page>
		</>
	);
}
