import { joinRoom } from "trystero";

import { Image, PageHeader, Text } from "grommet";
import AsyncRoute from "preact-async-route";
import { Router } from "preact-router";
import { encryptDecrypt } from "./helpers/cryptoSuite";
import { isRtcSupported } from "./helpers/helpers";
import { baseUrl, defaultRoomConfig } from "./helpers/roomConfig";
import pcdLogo from "/logo.svg";

const RTCSupport = isRtcSupported();

function App() {
  return (
    <>
      {RTCSupport ? (
        <Router>
          <AsyncRoute
            path={`${baseUrl}`}
            getComponent={() =>
              import("./views/RoomCreator").then((module) => module.RoomCreator)
            }
          />
          <AsyncRoute
            path={`${baseUrl}/About`}
            getComponent={() =>
              import("./views/About").then((module) => module.default)
            }
          />
          <AsyncRoute
            path={`${baseUrl}:id/:pwd?`}
            getComponent={(url) =>
              import("./MainModal").then(async (module) => {
                console.log(url);
                const cleanUrl = url.split("/");
                if (cleanUrl.length < 3) alert("Invalid URL");
                const roomId = cleanUrl[2].trim();
                const password = cleanUrl[3]?.trim();

                const room = await joinRoom(
                  {
                    ...defaultRoomConfig,
                    password: password !== "" ? password : undefined,
                    encryptDecrypt,
                  },
                  roomId
                );
                return module.default(roomId, room);
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
                Google Chrome.
              </Text>
            }
          />
        </>
      )}
    </>
  );
}

export default App;
