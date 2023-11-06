import { Image, Main, Page, PageHeader } from "grommet";
import pcdLogo from "/logo.svg";

interface Props {
  children: React.ReactNode;
}

export default function CollapsibleContainer({ children }: Props) {
	return (
		<Page kind="narrow">
			<PageHeader
				title="Paracord"
				pad="medium"
				actions={<Image alt="paracord logo" height="80vh" src={pcdLogo} />}
			/>
			<Main pad="large">		
				{children}
			</Main>
		</Page>
	);
}
