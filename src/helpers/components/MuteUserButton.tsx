import { Button } from "grommet";
import { Radial, RadialSelected } from "grommet-icons";

interface Props {
	isMuted: boolean;
	toggleMuted: () => void;
}

export default function MuteUserButton({ isMuted, toggleMuted }: Props) {
	const icon = isMuted ? <Radial title="unblock transmission" /> : <RadialSelected title="block transmission" />;
	const title = isMuted ? "unblock transmission" : "block transmission";
	return (
		<Button
			icon={icon}
			color="brand"
			title={title}
			pad="0"
			onClick={toggleMuted}
		/>
	);
}
