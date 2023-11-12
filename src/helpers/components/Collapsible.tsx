import { Box, Button } from "grommet";
import { CaretDownFill, CaretRightFill } from "grommet-icons";
import { HTMLAttributes } from "preact/compat";
import { useState } from "preact/hooks";

interface CollapsibleProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  open?: boolean;
}

export default function CollapsibleContainer(props: CollapsibleProps) {
	const { children, title, open = false, ...extprops } = props;
	const [collapsed, setCollapsed] = useState(!open);

	const toggleCollapsed = () => setCollapsed(c=>!c);

	return (
		<Box {...extprops}>
			<Button
				width="100%"
				icon={collapsed ? <CaretRightFill /> : <CaretDownFill />}
				label={title}
				onClick={toggleCollapsed}
			/>
			{!collapsed && children}
		</Box>
	);
}
