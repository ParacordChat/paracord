import { Button, Image, PageHeader, Text } from "grommet";
import AsyncRoute from "preact-async-route";
import { Router } from "preact-router";
import { isRtcSupported } from "../helpers/helpers";
import pcdLogo from "/logo.svg";

const RTCSupport = isRtcSupported();

const loadingComponent = () => (
	<div
		style={{
			height: "100%",
			margin: "0",
			display: "flex",
			justifyContent: "center",
			alignItems: "center"
		}}
	>
    Loading...
		<Button onClick={() => location.reload()}>Stuck? Click here</Button>
	</div>
);

function App() {
	return (
		<>
			{RTCSupport ? (
				<Router>
					<AsyncRoute
						path={`/`}
						default
						getComponent={() =>
							import("./createView/RoomCreator").then(
								(module) => module.RoomCreator
							)
						}
					/>
					<AsyncRoute
						path={`/About`}
						getComponent={() =>
							import("./createView/About").then((module) => module.default)
						}
					/>
					<AsyncRoute
						path={`/Enterprise`}
						getComponent={() =>
							import("./createView/Enterprise").then((module) => module.default)
						}
					/>
					<AsyncRoute
						path={`/r/:id`}
						getComponent={(url) =>
							import("./createView/PasswordModal").then(async (module) => {
								const cleanUrl = url.split("/");
								if (cleanUrl.length < 2) alert("Invalid URL");
								const roomIdProps = cleanUrl[2].trim()
									.split("?");
								const roomProps =
                  roomIdProps.length === 1 ? ["s", "f"] : [...roomIdProps[1]];
								if (roomProps.length === 0) roomProps.push("s");
								if (roomProps.length < 2) roomProps.push("f");

								return module.default(
									roomIdProps[0],
									roomProps[1],
									roomProps[0] === "s"
								);
							})
						}
						loading={loadingComponent}
					/>
				</Router>
			) : (
				<>
					<PageHeader
						title="Paracord"
						subtitle="Sorry, your browser is not supported"
						parent={<Image alt="paracord logo" src={pcdLogo} />}
						actions={
							<Text size="small">
                Paracord uses WebRTC to connect peers, and your browser does not
                support it. Please use a browser that supports WebRTC, such as
                Firefox or Google Chrome.
							</Text>
						}
					/>
				</>
			)}
		</>
	);
}

export default App;
