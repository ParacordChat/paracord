import { Button } from "grommet";
import { VNode } from "preact";
import { useClientSideUserTraits } from "../../../stateManagers/userManagers/clientSideUserTraits";


const Tabs = ({ tabs }:{tabs:{label:string, icon:VNode}[]}) => {
	const activeTab = useClientSideUserTraits((state) =>
		state.activeTab
	);

	return (
		<div>
			<div className="tab-list">
				{tabs.map((entry, index) => (
					<Button 
						key={index} 
						className={entry.label === activeTab ? "active" : ""}
						 primary={entry.label === activeTab}
						 icon={entry.icon}
						 title={entry.label}
						 onClick={() => useClientSideUserTraits.getState()
							.setActiveTab(entry.label)}
						 />
						
				))}
			</div>
		</div>
	);
};

export default Tabs;