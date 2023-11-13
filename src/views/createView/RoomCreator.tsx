import {
	Anchor,
	Box,
	Button,
	CheckBox,
	Footer,
	Text,
	TextInput
} from "grommet";
import { Down, Login, Organization, Risk } from "grommet-icons";
import { route } from "preact-router";
import { useRef, useState } from "preact/hooks";
import packageJson from "../../../package.json";
import GenericHeader from "../../helpers/components/GenericHeader";
import { genId } from "../../helpers/utils";

export function RoomCreator() {
	const [usePassword, setUsePassword] = useState(true);
	const roomRef = useRef<HTMLInputElement>(null);
	const loadRoom = () =>
		route(`/${usePassword ? "s" : "p"}/${roomRef.current?.value}`);
	return (
		<>
			<GenericHeader>
				<Box
					background={{
						image: "url(./distbg.svg)",
						size: "cover",
						position: "center"
					}}
					style={{ height: "100vh" }}
				>
					<Box
						direction="column"
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							height: "100vh",
							textAlign: "center",
							paddingBottom: "3em"
						}}
					>
						<Text size="large" color="#FFFC00" style={{ background:"black" }}>
            The ghost keeps your messages.{" "}
							<a href="https://www.nytimes.com/2014/05/09/technology/snapchat-reaches-settlement-with-federal-trade-commission.html?_r=0">
              Forever
							</a>
            .
						</Text>
						<Text size="large" color="#7289da" style={{ background:"black" }}>
            Same goes for a certain purple...{" "}
							<a href="https://www.reddit.com/r/privacy/comments/jy14qi/psa_discord_lies_about_removing_deleted_files/">
              creature
							</a>
            .
						</Text>
						<Text size="large" style={{ background:"black" }}>
            Want privacy? Choose <b style={{ color: "#4bffac" }}>Para</b>
							<b style={{ color: "#af79ff" }}>cord</b>.
						</Text>
						<Text size="small" style={{ background:"black" }}>
							Send multiple gigabytes, Call and chat without anyone in the middle.
						</Text>

						<Box direction="row">
							<Button style={{ 
								background:"black",
								border: "1px solid #af79ff",
								clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 40%)",
								padding: "1em",
								paddingBottom: "2em"
							}} onClick={() => route("/Enterprise")}>
								<Box direction="column" style={{
									alignItems: "center",
									justifyContent: "center"
								}}>
								Organizations
									<Organization />
								</Box>
							</Button>
							<Button pad="large" style={{ 
								background:"black",
								border: "1px solid #4bffac",
								clipPath: "polygon(0 0, 100% 0, 100% 60%, 0 100%)",
								padding: "1em"
							}} onClick={()=>document.querySelector("#roomCreate")
								?.scrollIntoView()}>
								<Box direction="column" style={{
									alignItems: "center",
									justifyContent: "center"
								}}>
								People
									<Down size="large"/>
								</Box>
							</Button>
						</Box>
					</Box>
				</Box>

				<Box border={{ color: "brand", size: "large" }} pad="medium" id="roomCreate" style={{ marginTop: "50vh", marginBottom: "50vh" }}>
					<Text size="medium">Create a room:</Text>
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
					<Button onClick={loadRoom} label="Go" primary />
				</Box>
				
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
						route(`/About`);
					}}
				/>
			</Footer>
		</>
	);
}
