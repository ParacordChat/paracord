import { Box, Button, Meter, Text } from "grommet";
import { Download, FormClose, Refresh } from "grommet-icons";
import { selfId } from "../Distra";
import DownloadManager from "../DistraManagers/downloadManager";
import CollapsibleContainer from "../helpers/components/Collapsible";
import FileUploader from "../helpers/components/FileUploader";
import { fancyBytes } from "../helpers/helpers";
import { useProgressStore } from "../stateManagers/downloadManagers/progressManager";
import { useRealFiles } from "../stateManagers/downloadManagers/realFileManager";
import { useOfferStore } from "../stateManagers/downloadManagers/requestManager";
import { useUserStore } from "../stateManagers/userManagers/userStore";

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
				<div style={{ height: "100%", overflow: "scroll" }}>
					<CollapsibleContainer
						open={true}
						style={{
							padding: "1rem 1.2rem"
						}}
						title="Send File"
					>
						<FileUploader
							uiInteractive={uiInteractive}
							addFiles={(files) => {
								downloadManagerInstance.addRealFiles(files);
							}}
						/>

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
                		direction="row"
                		border={{ color: "accent-1", size: "medium" }}
                		key={id}
                	>
                		<Text size="medium">
                			{file.name} {fancyBytes(file.size)}{" "}
                		</Text>
                		<Button
                			type="button"
                			style={{ marginLeft: "auto" }}
                			primary
                			onClick={() => downloadManagerInstance.removeRealFile(id)}
                			icon={<FormClose />}
                		/>
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
                						primary
                						icon={<Download />}
                					title="Request"
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
											? ` ← ${status.name} (${(status.progress * 100).toFixed(
												2
											)}%)`
											: `(${(status.progress * 100).toFixed(2)}%) ${
												status.name
											} →`}
									</Text>
									<Box direction="row">
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
										<Button
											style={{ padding: "0.3em" }}
											onClick={() =>
												downloadManagerInstance.attemptResume(status.uuid)
											}
											icon={<Refresh />}
										/>
										{/* <Button //TODO: add back
											style={{ padding: "0.3em" }}
											onClick={() =>
												downloadManagerInstance.pauseFile(status.uuid)
											}
											icon={<Pause />}
										/> */}
										<Button
											style={{ padding: "0.3em" }}
											primary
											onClick={() =>
												downloadManagerInstance.cancelFile(status.uuid)
											}
											icon={<FormClose />}
										/>
									</Box>
								</Box>
							))}
						</Box>
					</CollapsibleContainer>
				</div>
			)}
		</>
	);
}
