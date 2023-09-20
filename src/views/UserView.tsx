import { funAnimalName } from "fun-animal-names";
import {
  Box,
  Button,
  Footer,
  InfiniteScroll,
  Nav,
  Sidebar,
  Text,
  TextInput,
} from "grommet";
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
        <Footer round="small" background="brand" pad="medium">
          <Button hoverIndicator icon={<Download />} />
          <Button hoverIndicator icon={<Phone />} />
          <Button hoverIndicator icon={<Camera />} />
          <Button hoverIndicator icon={<Monitor />} />
        </Footer>
      }
    >
      {/*TODO: download dialog, screen/video/audio share */}
      <Nav gap="small">
        <Box
          pad="small"
          style={{
            whiteSpace: "pre-line",
            //fill space with height
            overflowX: "auto",
            overflowY: "scroll",
            // overflow: "auto",
            height: "26em",
          }}
        >
          {activePeers.length ? (
            <InfiniteScroll
              items={activePeers.filter((p) => p.roomId === roomId && p.active)}
            >
              {({ name, id }: { name: string; id: string }) => (
                <div>
                  <Box key={id} direction="row" gap="small">
                    <MuteUserButton
                      toggleMuted={() => mutedPeers.toggleMute(id)}
                      isMuted={mutedPeers.mutedUsers[id] || false}
                    />
                    <Text style={{ color: generateHexColorFromString(id) }}>
                      {name}
                    </Text>
                  </Box>
                  <Text size="small" style={{ color: "grey" }}>
                    {funAnimalName(id)}
                  </Text>
                </div>
              )}
            </InfiniteScroll>
          ) : (
            <Text size="medium">Waiting...</Text>
          )}
        </Box>
      </Nav>
    </Sidebar>
  );
}
