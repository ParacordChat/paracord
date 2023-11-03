import { Box, CheckBox, TextInput } from "grommet";
import { useClientSideUserTraits } from "../../stateManagers/userManagers/clientSideUserTraits";

export function SettingsView() {
	const [disappearingMessagesCount, setDisappearingMessagesCount] =
    useClientSideUserTraits((state) => [
    	state.disappearingMessagesLength,
    	state.setDisappearingMessagesLength
    ]);

	return (
		<>
			<Box direction="column">
				<Box direction="row" gap="small" align="center">
					<CheckBox
						pad="small"
						label="Use Disappearing Messages?"
						color="brand"
						checked={disappearingMessagesCount !== 0}
						onChange={(event: {
              target: {
                checked: boolean | ((prevState: boolean) => boolean);
              };
            }) => setDisappearingMessagesCount(event.target.checked ? 1000 : 0)}
					/>
					<TextInput
						border={{ color: "brand", size: "small" }}
						name="userInput"
						autoComplete="off"
						label="Message length"
						disabled={disappearingMessagesCount === 0}
						value={disappearingMessagesCount}
						onChange={(e: { target: { value: string } }) =>
							setDisappearingMessagesCount(Number(e.target.value))
						}
					/>
				</Box>
			</Box>
		</>
	);
}
