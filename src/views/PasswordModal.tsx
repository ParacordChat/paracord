/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react/display-name */
import { Box, Button, Text, TextInput } from "grommet";
import { FormView, FormViewHide, Key } from "grommet-icons";
import { useEffect, useRef, useState } from "preact/hooks";
import { joinFirebaseRoom, Room } from "../Distra";
import MainModal from "../MainModal";
import { firebaseRoomConfig } from "../helpers/consts/roomConfig";
import GenericHeader from "./helpers/GenericHeader";

const PasswordModal = (roomId: string, hasPassword: boolean) => () => {
	const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
	const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
	const passwordRef = useRef<HTMLInputElement>(null);

	const roomSet = async (password = "") => {
		if (!currentRoom) {
			const room = await joinFirebaseRoom(
				{
					...firebaseRoomConfig,
					password: password === "" ? undefined : password
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
				<GenericHeader>
					<Text color="red">
            Please set the password if you are creating this room, or enter
            password to join room
					</Text>
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
				</GenericHeader>
			)}
		</>
	);
};

export default PasswordModal;
