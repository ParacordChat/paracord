import { Button } from "grommet";
import { Radial, RadialSelected } from "grommet-icons";

export default function MuteUserButton(props: {
  isMuted: boolean;
  toggleMuted: () => void;
}) {
	const { isMuted, toggleMuted } = props;
	return (
		<Button
			icon={isMuted ? <Radial alt="unblock transmission" /> : <RadialSelected alt="block transmission" />}
			style={{ color: "var(--accent-major)" }}
			pad="0"
			onClick={toggleMuted}
		/>
	);
}
