import { Box, Button, Image, PageHeader, Text } from "grommet";
import AsyncRoute from "preact-async-route";
import { route, Route, Router } from "preact-router";
import { isRtcSupported } from "./helpers/helpers";
import pcdLogo from "/logo.svg";

const RTCSupport = isRtcSupported();

const Component404 = () => (
	<Box direction="column">
		<Text size="xlarge">404</Text>
		<Text size="medium">Page not found</Text>
		<Button label="Go home" onClick={() => route("/", true)} />
	</Box>
);

function App() {
	return (
		<>
			{RTCSupport ? (
				<Router>
					<Route path="*" component={Component404} />
					<Route path="/404" component={Component404} />
					<AsyncRoute
						path={`/`}
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
						path={`/:id/:pwd?`}
						getComponent={(url) =>
							import("./views/PasswordModal").then(async (module) => {
								const cleanUrl = url.split("/");
								if (cleanUrl.length < 2) alert("Invalid URL");
								const roomId = cleanUrl[1].trim();
								const password = cleanUrl[2]?.trim();
								if (password && password !== "a") route("/404", true);

								return module.default(roomId, password === "a");
							})
						}
						loading={() => <div>loading...</div>}
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
