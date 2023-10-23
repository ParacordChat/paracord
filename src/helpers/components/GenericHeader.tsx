import { Box, Image, Main, Page, PageHeader } from "grommet";
import pcdLogo from "/logo.svg";

export default function CollapsibleContainer(props: { children: any }) {
	const { children } = props;
	return (
		<Page kind="narrow">
			<PageHeader
				title="Paracord"
				pad="medium"
				subtitle="There in seconds, gone in seconds. Always yours."
				// parent={<Anchor label="Parent Page" />}
				actions={<Image alt="paracord logo" style={{ height: "5em" }} src={pcdLogo} />}
			/>
			<Main pad="large">
				<Box
					direction="column"
					border={{ color: "brand", size: "large" }}
					pad="medium"
				>
					{children}
				</Box>
			</Main>
		</Page>
	);
}
