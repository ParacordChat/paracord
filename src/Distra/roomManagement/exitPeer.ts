import { useHookStateManager } from "./state/hookState";
import { useRoomSignalManager } from "./state/roomSignalManager";
import { useRoomStateManager } from "./state/stateManager";

export const exitPeer = (id: string) => {
	if (!useRoomStateManager.getState().peerMap[id]) {
		return;
	}

	useRoomStateManager.getState()
		.removeFromPeerMap(id);
	useRoomSignalManager.getState()
		.removeFromPendingPongs(id);
	useRoomStateManager.getState()
		.removeFromPendingTransmissions(id);
	useHookStateManager.getState()
		.onPeerLeave(id);
};
