import { funAnimalName } from "fun-animal-names";
import {
	Box,
	Button,
	InfiniteScroll,
	Nav,
	Sidebar,
	Text,
	TextInput
} from "grommet";
import { FormNext, FormPrevious } from "grommet-icons";
import { useEffect, useState } from "preact/hooks";
import { selfId } from "../../Distra";
import UserManager from "../../DistraManagers/userManager";
import MuteUserButton from "../../helpers/components/MuteUserButton";
import { generateHexColorFromString } from "../../helpers/helpers";
import { useClientSideUserTraits } from "../../stateManagers/userManagers/clientSideUserTraits";
import { usePersonaStore } from "../../stateManagers/userManagers/personaStore";
import { useUserStore } from "../../stateManagers/userManagers/userStore";

export function UserView(props: {
  roomId: string;
  userManagerInstance: UserManager;
}) {
	const { roomId, userManagerInstance } = props;
	const activePersona = usePersonaStore((state) => state.persona);
	const activePeers = useUserStore((state) => state.users);
	const mutedPeers = useClientSideUserTraits();
	const [showSidebar, setShowSidebar] = useState(true);

	useEffect(() => {
		// hide sidebar on window resize
		window.addEventListener("resize", () => setShowSidebar(window.innerWidth > 660));
	});

	return showSidebar ? (
		<Sidebar
			border={{ color: "brand", size: "small" }}
			round="small"
			style={{ height: "84vh" }}
			header={
				<>
					<Box round="small" pad="small" background="dark-1">
						<Box direction="row" gap="medium">
							<Text
								size="large"
								style={{ color: generateHexColorFromString(selfId) }}
							>
                You
							</Text>
							<Button
								icon={<FormNext />}
								color="theme"
								style={{ marginLeft: "auto" }}
								onClick={() => setShowSidebar(!showSidebar)}
							/>
						</Box>
						<TextInput
							type="text"
							value={activePersona?.name}
							autocapitalize={"off"}
							autoComplete={"off"}
							style={{ width: "100%" }}
							onBlur={(e: { currentTarget: { value: string } }) =>
								e.currentTarget.value.trim() !== "" &&
                userManagerInstance.setMyName(e.currentTarget.value)
							}
						/>
						<Text size="small" style={{ color: "grey" }}>
							{funAnimalName(selfId)}
						</Text>
					</Box>
				</>
			}
		>
			<Nav gap="small">
				<Text size="large">Peers</Text>
				<Box
					pad="small"
					border={{ color: "brand", size: "small" }}
					round="small"
					background="dark-1"
					style={{
						whiteSpace: "pre-line",
						// fill space with height
						overflowX: "auto",
						overflowY: "scroll",
						// overflow: "auto",
						height: "30vh"
					}}
				>
					{activePeers.length > 0 ? (
						<InfiniteScroll
							items={activePeers.filter((p) => p.roomId === roomId && p.active)}
							pad="small"
							style={{
								scrollbars: "hidden"
							}}
						>
							{({ name, id }: { name: string; id: string }) => {
								const isTyping = useClientSideUserTraits.getState().typingUsers.includes(id);
								return(
									<div>
										<Box key={id} direction="row" gap="small">
											<MuteUserButton
												toggleMuted={() => mutedPeers.toggleMute(id)}
												isMuted={mutedPeers.mutedUsers[id] || false}
											/>
											<Text style={{ color: generateHexColorFromString(id) }} className={isTyping && "bouncing-letters"}>
												{name}
											</Text>
										</Box>
										<Text size="small" style={{ color: "grey" }}>
											{funAnimalName(id)}
										</Text>
									</div>
								);
							}}
						</InfiniteScroll>
					) : (
						<>
							<Text size="medium">Waiting...</Text>
							<Text color="red" size="small">
                [invite another person to unlock the UI]
							</Text>
						</>
					)}
				</Box>
			</Nav>
		</Sidebar>
	) : (
		<Button
			primary
			icon={<FormPrevious />}
			onClick={() => setShowSidebar(!showSidebar)}
		/>
	);
}
