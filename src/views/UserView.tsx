import { funAnimalName } from "fun-animal-names";
import { Box, Button, Footer, Nav, Sidebar, Text, TextInput } from "grommet";
import { Camera, Download, Monitor, Phone } from "grommet-icons";
import { selfId } from "trystero";
import UserManager from "../TrysteroManagers/userManager";
import { generateHexColorFromString } from "../helpers/helpers";
import { useClientSideUserTraits } from "../stateManagers/userManagers/clientSideUserTraits";
import { usePersonaStore } from "../stateManagers/userManagers/personaStore";
import { useUserStore } from "../stateManagers/userManagers/userStore";
import MuteUserButton from "./helpers/MuteUserButton";

export function UserView(props: {
  roomId: string;
  userManagerInstance: UserManager;
}) {
  const { roomId, userManagerInstance } = props;
  const activePersona = usePersonaStore((state) => state.persona);
  const activePeers = useUserStore((state) => state.users);
  const mutedPeers = useClientSideUserTraits();
  return (
    <Sidebar
      border={{ color: "brand", size: "small" }}
      round="small"
      header={
        <>
          <Text
            size="large"
            style={{ color: generateHexColorFromString(selfId) }}
          >
            You
          </Text>
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
          <hr />
          <Text size="large">Peers</Text>
        </>
      }
      footer={
        <Button
          icon={
            <Footer background="brand" pad="medium">
              <Download />
              <Phone />
              <Camera />
              <Monitor />
            </Footer>
          }
          hoverIndicator
        />
      }
    >
      {/*TODO: download dialog, screen/video/audio share */}
      <Nav gap="small">
        <ul
          style={{
            listStyle: "none",
          }}
        >
          {activePeers.length ? (
            activePeers
              .filter((p) => p.roomId === roomId && p.active)
              .map(({ name, id }) => (
                <li key={id}>
                  <Box direction="row" gap="small">
                    <MuteUserButton
                      toggleMuted={() => mutedPeers.toggleMute(id)}
                      isMuted={mutedPeers.mutedUsers[id] || false}
                    />
                    <Text
                      className="horizontal"
                      style={{ color: generateHexColorFromString(id) }}
                    >
                      {name}
                    </Text>
                  </Box>
                  <Text size="small" style={{ color: "grey" }}>
                    {funAnimalName(id)}
                  </Text>
                </li>
              ))
          ) : (
            <Text size="medium">Waiting...</Text>
          )}
        </ul>
      </Nav>
    </Sidebar>
  );
}
