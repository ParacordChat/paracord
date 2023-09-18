import {
  Anchor,
  Box,
  Button,
  Footer,
  Main,
  Page,
  PageHeader,
  Text,
  TextInput,
} from "grommet";
import { FormView, FormViewHide, Key, Login, Risk } from "grommet-icons";
import { useRef, useState } from "preact/hooks";
import shortid from "shortid";
import pcdLogo from "/logo.svg";

export function RoomCreator(props: {
  bootStrapRoom: (id: string, password?: string) => void;
}) {
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
  const roomRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const { bootStrapRoom } = props;
  return (
    <>
      <Page kind="narrow">
        <PageHeader
          title="Paracord"
          subtitle="There in seconds, gone in seconds. Always yours."
          // parent={<Anchor label="Parent Page" />}
          actions={<img style={{ height: "5em" }} src={pcdLogo} />}
        />
        <Main pad="large">
          <Box
            direction="column"
            border={{ color: "brand", size: "large" }}
            pad="medium"
          >
            <Box direction="row">
              <TextInput
                ref={roomRef}
                name="userInput"
                autoComplete="off"
                icon={<Login />}
                placeholder="Room ID"
              />
              <Button
                icon={<Risk />}
                className="button"
                onClick={() =>
                  roomRef.current &&
                  (roomRef.current.value = shortid.generate())
                }
              >
                Random
              </Button>
            </Box>
            <Box direction="row">
              <TextInput
                icon={<Key />}
                ref={passwordRef}
                name="userInput"
                type={passwordVisible ? "text" : "password"}
                autoComplete="off"
                placeholder="Password (optional)"
              />
              <Button
                icon={passwordVisible ? <FormView /> : <FormViewHide />}
                onClick={() => setPasswordVisible(!passwordVisible)}
              />
            </Box>
            <Button
              onClick={() =>
                roomRef.current &&
                bootStrapRoom(
                  roomRef.current.value,
                  passwordRef.current ? passwordRef.current.value : undefined
                )
              }
              label="Go"
              primary
            />
          </Box>
        </Main>
        <Footer background="brand" pad="medium">
          <Text>Copyright 2023 ParaCord</Text>
          <Anchor label="About" />
        </Footer>
      </Page>
    </>
  );
}
