import { RoomStateManager } from "./stateManager";

export const buildExitPeer = (roomState: RoomStateManager) => (id: string) => {
	if (!roomState.peerMap[id]) {
		return;
	}

	delete roomState.peerMap[id];
	delete roomState.pendingTransmissions[id];
	delete roomState.pendingPongs[id];
	roomState.onPeerLeave(id);
};
