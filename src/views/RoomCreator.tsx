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
import { route } from "preact-router";
import { useRef, useState } from "preact/hooks";
import shortid from "shortid";
import pcdLogo from "/logo.svg";

export function RoomCreator() {
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
  const roomRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
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
                onClick={() =>
                  roomRef.current &&
                  (roomRef.current.value = shortid.generate())
                }
                label="Random"
              />
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
                route(
                  `/paracord/${roomRef.current?.value}/${passwordRef.current?.value}`,
                  true
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
