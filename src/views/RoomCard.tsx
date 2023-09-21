import { Box, Button, Header, Image, Text } from "grommet";
import { CaretLeftFill, Copy } from "grommet-icons";
import { route } from "preact-router";
import { baseUrl } from "../helpers/roomConfig";
import pcdLogo from "/logo.svg";

export function RoomCard(props: { roomId: string }) {
	const { roomId } = props;
	return (
		<Header background="brand" pad="medium">
			<Box
				direction="row"
				align="center"
				gap="small"
				style={{
					borderBottom: "1px solid #eaeaea",
					paddingTop: "0"
				}}
			>
				<Button
					label="home"
					onClick={() => {
						route(`/${baseUrl}`, true);
						location.reload();
					}}
					icon={<CaretLeftFill />}
				/>

				<Image style={{ height: "4em" }} src={pcdLogo} />
				<Box style={{ width: "100%" }}>
					<Text size="xxlarge">Paracord</Text>
					<hr />
					<Box direction="row">
						<Text size="small" style={{ paddingRight: "1em" }}>
              Room ID
						</Text>
						<Text size="medium">{roomId}</Text>
					</Box>
				</Box>
			</Box>
			<Button
				style={{ marginLeft: "auto" }}
				onClick={() => {
					navigator.clipboard.writeText(window.location.href);
				}}
				label="Copy room link"
				icon={<Copy />}
			/>
		</Header>
	);
}
