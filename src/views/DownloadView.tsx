import { Box, Button, Meter, Text } from "grommet";
import { FormClose } from "grommet-icons";
import { FileUploader } from "react-drag-drop-files";
import DownloadManager from "../TrysteroManagers/downloadManager";
import { fancyBytes } from "../helpers/helpers";
import { useProgressStore } from "../stateManagers/downloadManagers/progressManager";
import { useRealFiles } from "../stateManagers/downloadManagers/realFileManager";
import { useOfferStore } from "../stateManagers/downloadManagers/requestManager";
import { useUserStore } from "../stateManagers/userManagers/userStore";
import CollapsibleContainer from "./helpers/Collapsible";

export function DownloadView(props: {
  downloadManagerInstance: DownloadManager;
}) {
  const { downloadManagerInstance } = props;
  const realFiles = useRealFiles((state) => state.realFiles);
  const requestableDownloads = useOfferStore(
    (state) => state.requestableDownloads
  );
  const progressQueue = useProgressStore((state) => state.progressQueue);
  const uiInteractive = useUserStore(
    (state) => state.users.filter((p) => p.active).length > 0
  );

  return (
    <>
      {downloadManagerInstance && (
        <>
          <CollapsibleContainer
            open={true}
            className="filelistbox"
            title="Send File"
          >
            <FileUploader
              multiple
              required
              handleChange={downloadManagerInstance.addRealFiles}
              name="file"
              accept="*"
              disabled={!uiInteractive}
            >
              <Box
                background="dark-3"
                round="small"
                pad="medium"
                border={{ color: "brandSecondary", size: "medium" }}
              >
                Drag &amp; Drop files here
              </Box>
            </FileUploader>
            <Box
              background="dark-3"
              round="small"
              pad="medium"
              border={{ color: "brand", size: "medium" }}
            >
              {realFiles &&
                Object.entries(realFiles).map(([id, file]) => (
                  <Box
                    background="dark-3"
                    round="small"
                    pad="medium"
                    border={{ color: "brandSecondary", size: "medium" }}
                    key={id}
                  >
                    {file.name} <p>{fancyBytes(file.size)} </p>
                    <Button
                      type="button"
                      className="bigbutton"
                      style={{ padding: "0.3em" }}
                      onClick={() => downloadManagerInstance.removeRealFile(id)}
                      icon={<FormClose />}
                    />
                    <hr />
                  </Box>
                ))}
            </Box>
          </CollapsibleContainer>
          <CollapsibleContainer className="filelistbox" title="Send Request">
            <div className="filelistcontainer">
              {requestableDownloads &&
                Object.entries(requestableDownloads).map(([id, fileOffers]) => {
                  const userName = useUserStore((state) =>
                    state.users.find((u) => u.id === id)
                  )?.name;

                  return fileOffers.map(({ id, name, size, ownerId }) => (
                    <Box
                      className="filelistbox"
                      round="small"
                      background="dark-3"
                      pad="medium"
                      border={{ color: "brand", size: "medium" }}
                      key={id}
                    >
                      <Box direction="row">
                        <Text size="medium">{name}</Text>
                        <Box
                          style={{
                            paddingLeft: "1em",
                            paddingRight: "1em",
                          }}
                        >
                          <Text size="small">sent by {userName}</Text>
                          <Text size="xsmall">{fancyBytes(size)}</Text>
                        </Box>
                        <Button
                          onClick={() =>
                            downloadManagerInstance.requestFile(ownerId, id)
                          }
                          label="Request"
                        />
                      </Box>
                    </Box>
                  ));
                })}
            </div>
          </CollapsibleContainer>
          <CollapsibleContainer
            className="filelistbox"
            title="Active Transfers"
          >
            <Box
              background="dark-3"
              round="small"
              pad="medium"
              border={{ color: "brand", size: "medium" }}
            >
              {/* TODO: add a "stop" button */}
              {progressQueue.map((status) => (
                <Box
                  key={status.id}
                  className={status.id}
                  background="dark-3"
                  round="small"
                  pad="medium"
                  border={{ color: "brandSecondary", size: "medium" }}
                >
                  <Text size="medium" color="brand">
                    {status.toMe ? ` ← ${status.name}` : `${status.name} →`}
                  </Text>
                  <Meter
                    values={[
                      {
                        value: status.progress * 100,
                        label: status.name,
                        onClick: () => {},
                      },
                    ]}
                    aria-label="meter"
                  />
                </Box>
              ))}
            </Box>
          </CollapsibleContainer>
        </>
      )}
    </>
  );
}
