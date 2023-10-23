import { Button } from "grommet";
import { Volume, VolumeMute } from "grommet-icons";

export default function MuteUserButton(props: {
  isMuted: boolean;
  toggleMuted: () => void;
}) {
	const { isMuted, toggleMuted } = props;
	return (
		<Button
			icon={isMuted ? <VolumeMute /> : <Volume />}
			style={{ color: "var(--accent-major)" }}
			pad="0"
			onClick={toggleMuted}
		/>
	);
}
