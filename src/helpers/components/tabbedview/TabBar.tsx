import { Button } from "grommet";
import { VNode } from "preact";
import { useClientSideUserTraits } from "../../../stateManagers/userManagers/clientSideUserTraits";

const Tabs = ({
	tabs
}: {
	tabs: {
		label: string;
		icon: VNode;
	}[];
}) => {
	const activeTab = useClientSideUserTraits((state) => state.activeTab);
	const notifyTabs = useClientSideUserTraits((state) => state.notifyTabs);

	return (
		<div>
			<div className="tab-list">
				{tabs.map((entry, index) => (
					<Button
						key={index}
						className={entry.label === activeTab ? "active" : ""}
						primary={entry.label === activeTab}
						icon={
							<div
								style={{
									borderBottom: notifyTabs.has(entry.label)
										? "2px solid red"
										: undefined
								}}
							>
								{entry.icon}
							</div>
						}
						tip={entry.label}
						onClick={() => {
							useClientSideUserTraits.getState()
								.setActiveTab(entry.label);
							useClientSideUserTraits
								.getState()
								.removeFromNotifyTabs(entry.label);
						}}
					/>
				))}
			</div>
		</div>
	);
};

export default Tabs;
