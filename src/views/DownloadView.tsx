import { Box, Button, Meter, Text } from "grommet";
import { FormClose } from "grommet-icons";
import { FileUploader } from "react-drag-drop-files";
import { selfId } from "trystero";
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
	const uiInteractive = useUserStore((state) =>
		state.users.some((p) => p.active)
	);

	return (
		<>
			{downloadManagerInstance && (
				<>
					<CollapsibleContainer
						open={true}
						style={{
							padding: "1rem 1.2rem"
						}}
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
								border={{ color: "accent-1", size: "medium" }}
							>
								<Text>Drag &amp; Drop files here</Text>
							</Box>
						</FileUploader>
						<Box
							background="dark-3"
							round="small"
							pad="medium"
							border={{ color: "brand", size: "medium" }}
						>
							{realFiles &&
								Object.entries(realFiles)
									.map(([id, file]) => (
										<Box
											background="dark-3"
											round="small"
											pad="medium"
											border={{ color: "accent-1", size: "medium" }}
											key={id}
										>
											{file.name} <p>{fancyBytes(file.size)} </p>
											<Button
												type="button"
												style={{ padding: "0.3em" }}
												onClick={() => downloadManagerInstance.removeRealFile(id)}
												icon={<FormClose />}
											/>
											<hr />
										</Box>
									))}
						</Box>
					</CollapsibleContainer>
					<CollapsibleContainer
						style={{
							padding: "1rem 1.2rem"
						}}
						title="Send Request"
						open={true}
					>
						<Box
							background="dark-3"
							round="small"
							pad="medium"
							border={{ color: "brand", size: "medium" }}
						>
							{requestableDownloads &&
								Object.entries(requestableDownloads)
									.map(([id, fileOffers]) => {
										const userName = useUserStore((state) =>
											state.users.find((u) => u.id === id)
										)?.name;

										return fileOffers.map(({ id, name, size, ownerId }) => (
											<Box
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
															paddingRight: "1em"
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
						</Box>
					</CollapsibleContainer>
					<CollapsibleContainer
						style={{
							padding: "1rem 1.2rem"
						}}
						title="Active Transfers"
						open={true}
					>
						<Box
							background="dark-3"
							round="small"
							pad="medium"
							border={{ color: "brand", size: "medium" }}
						>
							{/* TODO: add a "stop" button */}
							{progressQueue.map((status, index) => (
								<Box
									key={`${status.id}-${index}`}
									className={status.id}
									background="dark-3"
									round="small"
									pad="medium"
									border={{ color: "accent-1", size: "medium" }}
								>
									<Text size="medium" color="brand">
										{status.toUser === selfId
											? ` ← ${status.name} (${Math.trunc(
												status.progress * 100
											  )}%)`
											: `(${Math.trunc(status.progress * 100)}%) ${
												status.name
											  } →`}
									</Text>
									<Meter
										values={[
											{
												value: status.progress * 100,
												label: status.name,
												onClick: () => {}
											}
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
