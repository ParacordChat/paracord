/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react/display-name */
import { Box, Button, Image, Main, Page, PageHeader, TextInput } from "grommet";
import { FormView, FormViewHide, Key } from "grommet-icons";
import { useEffect, useRef, useState } from "preact/hooks";
import { joinRoom, Room } from "trystero";
import MainModal from "../MainModal";
import { encryptDecrypt } from "../helpers/cryptoSuite";
import { defaultRoomConfig } from "../helpers/roomConfig";
import pcdLogo from "/logo.svg";

const PasswordModal = (roomId: string, hasPassword: boolean) => () => {
	const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
	const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
	const passwordRef = useRef<HTMLInputElement>(null);

	const roomSet = async (password = "") => {
		if (!currentRoom) {
			console.log("pswd", password);
			const room = await joinRoom(
				{
					...defaultRoomConfig,
					password: password === "" ? undefined : password,
					encryptDecrypt
				},
				roomId
			);
			setCurrentRoom(room);
		}
	};

	useEffect(() => {
		if (!hasPassword) roomSet();
	});

	return (
		<>
			{currentRoom ? (
				<MainModal roomId={roomId} room={currentRoom} />
			) : (
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
									icon={<Key />}
									ref={passwordRef}
									name="userInput"
									type={passwordVisible ? "text" : "password"}
									autoComplete="off"
									placeholder="Please enter a password"
									onKeyUp={(e: { key: string }) => {
										if (e.key === "Enter") {
											roomSet(passwordRef.current?.value);
										}
									}}
								/>
								<Button
									icon={passwordVisible ? <FormView /> : <FormViewHide />}
									onClick={() => setPasswordVisible(!passwordVisible)}
								/>
							</Box>
							<Button
								onClick={() => {
									roomSet(passwordRef.current?.value);
								}}
								label="Go"
								primary
							/>
						</Box>
					</Main>
				</Page>
			)}
		</>
	);
};

export default PasswordModal;
