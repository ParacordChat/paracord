import { create } from "zustand";

interface RoomSignalManager {
  pendingPongs: { [x: string]: (value?: unknown) => void };
  addToPendingPongs: (id: string, pong: (value?: unknown) => void) => void;
  removeFromPendingPongs: (id: string) => void;

  pendingStreamMetas: { [x: string]: any };
  addToPendingStreamMetas: (id: string, meta: any) => void;
  removeFromPendingStreamMetas: (id: string) => void;

  pendingTrackMetas: { [x: string]: any };
  addToPendingTrackMetas: (id: string, meta: any) => void;
  removeFromPendingTrackMetas: (id: string) => void;
}

export const useRoomSignalManager = create<RoomSignalManager>((set) => ({
	pendingPongs: {},
	addToPendingPongs: (id: string, pong: (value?: unknown) => void) => set((state) => {
		state.pendingPongs[id] = pong;
		return state;
	}),
	removeFromPendingPongs: (id: string) => set((state) => {
		delete state.pendingPongs[id];
		return state;
	}),

	pendingStreamMetas: {},
	addToPendingStreamMetas: (id: string, meta: any) => set((state) => {
		state.pendingStreamMetas[id] = meta;
		return state;
	}),
	removeFromPendingStreamMetas: (id: string) => set((state) => {
		delete state.pendingStreamMetas[id];
		return state;
	}),

	pendingTrackMetas: {},
	addToPendingTrackMetas: (id: string, meta: any) => set((state) => {
		state.pendingTrackMetas[id] = meta;
		return state;
	}),
	removeFromPendingTrackMetas: (id: string) => set((state) => {
		delete state.pendingTrackMetas[id];
		return state;
	})
}));