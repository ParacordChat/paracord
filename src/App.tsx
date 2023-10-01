import { Image, PageHeader, Text } from "grommet";
import AsyncRoute from "preact-async-route";
import { Router } from "preact-router";
import { isRtcSupported } from "./helpers/helpers";
import pcdLogo from "/logo.svg";

const RTCSupport = isRtcSupported();

function App() {
	return (
		<>
			{RTCSupport ? (
				<Router>
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
								if (cleanUrl.length < 3) alert("Invalid URL");
								const roomId = cleanUrl[2].trim();
								const password = cleanUrl[3]?.trim();

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
						parent={<Image src={pcdLogo} />}
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
