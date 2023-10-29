import { Image, PageHeader, Text } from "grommet";
import AsyncRoute from "preact-async-route";
import { Router } from "preact-router";
import { isRtcSupported } from "./helpers/helpers";
import pcdLogo from "/logo.svg";

const RTCSupport = isRtcSupported();

const loadingComponent = () => 
	<div style={{
		height: "100%",
		margin: "0",
		display: "flex",
		justifyContent: "center",
		alignItems: "center"
	}}>Loading...</div>;

function App() {
	return (
		<>
			{RTCSupport ? (
				<Router>
					<AsyncRoute
						path={`/`}
						default
						getComponent={() =>
							import("./views/RoomCreator").then((module) => module.RoomCreator)
						}
					/>
					<AsyncRoute
						path={`/About`}
						getComponent={() =>
							import("./views/About").then((module) => module.default)
						}
					/>
					<AsyncRoute
						path={`/p/:id`}
						getComponent={(url) =>
							import("./views/PasswordModal").then(async (module) => {
								const cleanUrl = url.split("/");
								if (cleanUrl.length < 2) alert("Invalid URL");
								const roomId = cleanUrl[2].trim();
								return module.default(roomId, false);
							})
						}
						loading={loadingComponent}
					/>
					<AsyncRoute
						path={`/s/:id`}
						getComponent={(url) =>
							import("./views/PasswordModal").then(async (module) => {
								const cleanUrl = url.split("/");
								if (cleanUrl.length < 2) alert("Invalid URL");
								const roomId = cleanUrl[2].trim();

								return module.default(roomId, true);
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
