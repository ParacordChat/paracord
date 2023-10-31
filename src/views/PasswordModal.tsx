/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react/display-name */
import { Box, Button, Text, TextInput } from "grommet";
import { CaretLeftFill, FormView, FormViewHide, Key } from "grommet-icons";
import { route } from "preact-router";
import { useEffect, useRef, useState } from "preact/hooks";
import { joinFirebaseRoom, Room } from "../Distra";
import MainModal from "../MainModal";
import GenericHeader from "../helpers/components/GenericHeader";
import { firebaseRoomConfig } from "../helpers/consts/roomConfig";

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
								roomSet(passwordRef.current?.value);
							}}
							style={{ marginLeft: "auto", width: "100%" }}
							label="Go"
							primary
						/>
					</Box>
				</GenericHeader>
			)}
		</>
	);
};

export default PasswordModal;
