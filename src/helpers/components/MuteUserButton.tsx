import { Button } from "grommet";
import { Radial, RadialSelected } from "grommet-icons";

interface Props {
  isMuted: boolean;
  toggleMuted: () => void;
}

export default function MuteUserButton({ isMuted, toggleMuted }: Props) {
	const icon = isMuted ? (
		<Radial tip="unblock transmission" />
	) : (
		<RadialSelected tip="block transmission" />
	);
	const title = isMuted ? "unblock transmission" : "block transmission";
	return (
		<Button
			icon={icon}
			color="brand"
			tip={title}
			pad="0"
			onClick={toggleMuted}
		/>
	);
}
