/* eslint-disable react/display-name */
import { Box, Button, Text, TextInput } from "grommet";
import { CaretLeftFill, FormView, FormViewHide, Key } from "grommet-icons";
import { route } from "preact-router";
import { useEffect, useRef, useState } from "preact/hooks";
import { joinFirebaseRoom, Room } from "../../Distra";
import GenericHeader from "../../helpers/components/GenericHeader";
import { firebaseRoomConfig, turnAPI } from "../../helpers/consts/roomConfig";
import MainModal from "../paneView/PaneModal";

const PasswordModal = (roomId: string, hasPassword: boolean) => () => {
	const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
	const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
	const passwordRef = useRef<HTMLInputElement>(null);

	const roomSet = async (password = "") => {
		if (!currentRoom) {
			const room = await fetch(turnAPI)
				.then(response=>response.json())
				.then(iceServers=>joinFirebaseRoom(
					{
						...firebaseRoomConfig,
						rtcConfig:{
							iceServers
						},
						password: password === "" ? undefined : password
					},
					roomId
				));
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
				<GenericHeader>
					<Box border={{ color: "brand", size: "large" }} pad="medium">
						<Text color="red">Enter room password:</Text>
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
								tip="Toggle password visibility"
							/>
						</Box>
						<Box direction="row">
							<Button
								label="home"
								onClick={() => {
									route(`/`, true);
									location.reload();
								}}
								icon={<CaretLeftFill />}
							/>
							<Button
								onClick={() => {
									if(passwordRef.current?.value.trim() === "") return;
									roomSet(passwordRef.current?.value);
								}}
								style={{ marginLeft: "auto", width: "100%" }}
								label="Go"
								primary
							/>
						</Box>
					</Box>
				</GenericHeader>
			)}
		</>
	);
};

export default PasswordModal;
