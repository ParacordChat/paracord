import { create } from "zustand";
import {
	ActionsType,
	ExtendedInstance
} from "../../../helpers/types/distraTypes";

interface RoomStateManager {
  peerMap: { [s: string]: ExtendedInstance };
  addToPeerMap: (id: string, peer: ExtendedInstance) => void;
  removeFromPeerMap: (id: string) => void;

  actions: { [x: string]: ActionsType };
  setActions: (type: string, actions: ActionsType) => void;

  pendingTransmissions: {
    [x: string]: { [x: string]: { [x: string]: any } };
  };
  addToPendingTransmissions: (
    id: string,
    targetId: string,
    transmission: any,
  ) => void;
  removeFromPendingTransmissions: (id: string) => void;
}

export const useRoomStateManager = create<RoomStateManager>((set) => ({
	peerMap: {},
	addToPeerMap: (id: string, peer: ExtendedInstance) =>
		set((state) => {
			state.peerMap[id] = peer;
			return state;
		}),
	removeFromPeerMap: (id: string) =>
		set((state) => {
			delete state.peerMap[id];
			return state;
		}),

	actions: {},
	setActions: (type: string, actions: ActionsType) =>
		set((state) => {
			state.actions[type] = actions;
			return state;
		}),

	pendingTransmissions: {},
	addToPendingTransmissions: (
		id: string,
		targetId: string,
		transmission: any
	) =>
		set((state) => {
			if (!state.pendingTransmissions[id]) {
				state.pendingTransmissions[id] = {};
			}
			state.pendingTransmissions[id][targetId] = transmission;
			return state;
		}),
	removeFromPendingTransmissions: (id: string) =>
		set((state) => {
			delete state.pendingTransmissions[id];
			return state;
		})
}));
