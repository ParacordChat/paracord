import { Box } from "grommet";
import { VNode } from "preact";
import { useClientSideUserTraits } from "../../../stateManagers/userManagers/clientSideUserTraits";

interface TabsProps {
    // tabname to viewport content
    tabs: { [label: string]: VNode};
}

const Tabs = ({ tabs }:TabsProps) => {
	const activeTab = useClientSideUserTraits((state) =>
		state.activeTab
	);

	return (
		<Box style={{ height: "84vh", overflow: "hidden" }}>
			{tabs[activeTab]}
		</Box>

	);
};

export default Tabs;
