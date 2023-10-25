import { create } from "zustand";
import { noOp } from "../../../helpers/utils";

interface HookStateManager {
  onPeerJoin: (arg0: string) => void;
  setOnPeerJoin: (arg0: (id: string) => void) => void;

  onPeerLeave: (arg0: string) => void;
  setOnPeerLeave: (arg0: (id: string) => void) => void;

  onPeerStream: (arg0: any, arg1: string, arg2: any) => void;
  setOnPeerStream: (arg0: (stream: any, id: string, meta: any) => void) => void;

  onPeerTrack: (arg0: any, arg1: any, arg2: string, arg3: any) => void;
  setOnPeerTrack: (
    arg0: (track: any, stream: any, id: string, meta: any) => void
  ) => void;

  onPeerError: (arg0: string, arg1: any) => void;
  setOnPeerError: (arg0: (id: string, error: any) => void) => void;
}

export const useHookStateManager = create<HookStateManager>((set) => ({
	onPeerJoin: noOp,
	setOnPeerJoin: (onPeerJoin: (id: string) => void) =>
		set((state) => {
			state.onPeerJoin = onPeerJoin;
			return state;
		}),
	onPeerLeave: noOp,
	setOnPeerLeave: (onPeerLeave: (id: string) => void) =>
		set((state) => {
			state.onPeerLeave = onPeerLeave;
			return state;
		}),
	onPeerStream: noOp,
	setOnPeerStream: (
		onPeerStream: (stream: any, id: string, meta: any) => void
	) =>
		set((state) => {
			state.onPeerStream = onPeerStream;
			return state;
		}),
	onPeerTrack: noOp,
	setOnPeerTrack: (
		onPeerTrack: (track: any, stream: any, id: string, meta: any) => void
	) =>
		set((state) => {
			state.onPeerTrack = onPeerTrack;
			return state;
		}),
	onPeerError: noOp,
	setOnPeerError: (onPeerError: (id: string, error: any) => void) =>
		set((state) => {
			state.onPeerError = onPeerError;
			return state;
		})
}));
