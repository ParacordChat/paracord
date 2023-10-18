import { ActionsType, ExtendedInstance } from "../helpers/types";
import { noOp } from "../helpers/utils";

export class RoomStateManager {
	public peerMap: { [s: string]: ExtendedInstance } = {};
	public actions: ActionsType = {};
	public pendingTransmissions: {
    [x: string]: { [x: string]: { [x: string]: any } };
  } = {};
	public pendingPongs: { [x: string]: (value?: unknown) => void } = {};
	public pendingStreamMetas: { [x: string]: any } = {};
	public pendingTrackMetas: { [x: string]: any } = {};
	public onPeerJoin: (arg0: string) => void = noOp;
	public onPeerLeave: (arg0: string) => void = noOp;
	public onPeerStream: (arg0: any, arg1: string, arg2: any) => void = noOp;
	public onPeerTrack: (arg0: any, arg1: any, arg2: string, arg3: any) => void =
		noOp;
	public onPeerError: (arg0: string, arg1: any) => void = noOp;

	constructor() {}
}
