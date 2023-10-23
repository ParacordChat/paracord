import { Box, Button } from "grommet";
import { CaretDownFill, CaretRightFill } from "grommet-icons";
import { VNode } from "preact";
import { useState } from "preact/hooks";

export default function CollapsibleContainer(
	props: any & {
    title: string;
    children: VNode<any>;
    open?: boolean;
  }
) {
	const { children, title, open = false, ...extprops } = props;
	const [collapsed, setCollapsed] = useState(!open);
	return (
		<Box {...extprops}>
			<Button
				width="100%"
				icon={collapsed ? <CaretRightFill /> : <CaretDownFill />}
				label={title}
				onClick={() => setCollapsed(!collapsed)}
			/>
			{!collapsed && children}
		</Box>
	);
}
