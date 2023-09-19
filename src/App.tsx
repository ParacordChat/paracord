import { joinRoom } from "trystero";

import AsyncRoute from "preact-async-route";
import { Router } from "preact-router";
import "./assets/App.css";
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
          <div className="headtext horizontal">
            <img style={{ height: ".5em" }} src={pcdLogo} />
            <h1 className="headtext">Paracord</h1>
          </div>
          <div className="center">
            <div className="card">
              <h2>Sorry, your browser is not supported</h2>
              <p>
                Paracord uses WebRTC to connect peers, and your browser does not
                support it. Please use a browser that supports WebRTC, such as
                Google Chrome.
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default App;
