import { useEffect, useState } from "preact/hooks";
import { BaseRoomConfig, Room, TorrentRoomConfig, joinRoom } from "trystero";
// import { FirebaseRoomConfig, Room, joinFirebaseRoom as joinRoom } from "trystero";

import MainModal from "./MainModal";
import "./assets/App.css";
import { encryptDecrypt } from "./helpers/cryptoSuite";
import { isRtcSupported } from "./helpers/helpers";
import { RoomCreator } from "./views/RoomCreator";
import pcdLogo from "/logo.svg";

//TODO: 4.0: add accounts with "boosting", paid fb vs free webtorrent. We should likely have our own tracker so we don't get blamed for outages

const installedTrackers = [
  "wss://tracker.openwebtorrent.com",
  "wss://tracker.btorrent.xyz",
  "wss://tracker.files.fm:7073/announce",
  "wss://qot.abiir.top:443/announce",
];

export const tradeName = "paracord_chat";

const defaultRoomConfig: BaseRoomConfig & TorrentRoomConfig = {
  appId: tradeName,
  trackerUrls: installedTrackers,
  rtcConfig: 
  {
    iceServers: [
      {
        urls: "stun:188.148.133.173:3478",
      },
      {
        urls: "turn:188.148.133.173:3478",
        username: "c386d75b5633456cb3bc13812858098d",
        credential: "58fd06d85fe14c0f9f46220748b0f565",
      },
      {
        urls: "turn:188.148.133.173:3478",
        username: "0e2f563eacfd4c4a82ea239b04d1d494",
        credential: "8179b4b533f240ad9fe590663bef1bc9",
      },
      {
        urls: "turn:188.148.133.173:3478",
        username: "feab95c3fcd147a2a96a3d3590bf9cda",
        credential: "654cafd885424b7fb974e65f631f25f9",
      },
    ],
  },
};

// const defaultRoomConfig: FirebaseRoomConfig = {
//   appId: "paracordserver-default-rtdb",
// };

const RTCSupport = isRtcSupported();


function App() {
  const [room, setRoom] = useState<Room | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);

  const bootStrapRoom = async (id: string, roomPassword?: string) => {
    if (id && !room) {
      const newRoom = await joinRoom(
        { ...defaultRoomConfig, password: roomPassword, encryptDecrypt },
        id
      );
      setRoomId(id);
      setRoom(newRoom);
      window.location.hash = `${id}?${roomPassword}`;
    }
  };

  useEffect(() => {
    if (window.top) {
      const roomInfo = window.top.location.hash.slice(1).split("?");
      if (roomInfo.length > 1) {
        bootStrapRoom(roomInfo[0], roomInfo[1]);
      } else {
        bootStrapRoom(roomInfo[0]);
      }
    }
  }, []);

  const leaveRoom = () => {
    if (room) {
      room.leave();
      setRoom(null);
      setRoomId(null);
      window.location.hash = "";
    }
  };

  return (
    <>
      {RTCSupport ? (
        room && roomId ? (
          <>
            <MainModal room={room} roomId={roomId} leaveRoom={leaveRoom} />
          </>
        ) : (
          <RoomCreator bootStrapRoom={bootStrapRoom} />
        )
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
