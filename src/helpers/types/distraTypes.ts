import { FirebaseApp } from "firebase/app";
import { Instance } from "simple-peer";
import { User } from "./types";

// export type Metadata =
// 	| null
// 	| string
// 	| number
// 	| boolean
// 	| undefined
// 	| Metadata[]
// 	| { [key: string]: Metadata };

export type StrictMetadata = {
	[key: string]: StrictMetadata | string | number | boolean | undefined;
};

export interface BaseRoomConfig {
	appId: string;
	password?: string;
	rtcConfig?: RTCConfiguration;
}

export interface FirebaseRoomConfig extends BaseRoomConfig {
	appId: string;
	firebaseApp?: FirebaseApp;
	rootPath?: string;
}

export interface TorrentRoomConfig extends BaseRoomConfig {
	trackerUrls?: string[];
	trackerRedundancy?: number;
}

export type TargetPeers = string[] | undefined;

export interface ActionSender<T> {
	(
		data: T,
		targetPeers?: TargetPeers | User[],
		metadata?: StrictMetadata,
		progress?: (
			percent: number,
			peerId: string,
			metadata?: StrictMetadata
		) => void
	): Promise<void>;
}

export interface ActionReceiver<T> {
	(
		receiver: (data: T, peerId: string, metadata?: StrictMetadata) => void
	): void;
}

export interface ActionProgress {
	(
		progressHandler: (
			percent: number,
			peerId: string,
			metadata?: StrictMetadata
		) => void
	): void;
}

export type MakeAction<T> = (
	namespace: string,
	forceEncryption?: boolean
) => [ActionSender<T>, ActionReceiver<T>, ActionProgress];

export interface Room {
	makeAction: <T>(
		namespace: string,
		forceEncryption?: boolean
	) => [ActionSender<T>, ActionReceiver<T>, ActionProgress];

	ping: (id: string) => Promise<number>;

	leave: () => void;

	getPeers: () => Record<string, RTCPeerConnection>;

	addStream: (
		stream: MediaStream,
		targetPeers?: TargetPeers,
		metadata?: StrictMetadata
	) => Promise<(void | void[])[]>;

	removeStream: (stream: MediaStream, targetPeers?: TargetPeers) => void;

	addTrack: (
		track: MediaStreamTrack,
		stream: MediaStream,
		targetPeers?: TargetPeers,
		metadata?: StrictMetadata
	) => Promise<void[]> | undefined;

	removeTrack: (
		track: MediaStreamTrack,
		stream: MediaStream,
		targetPeers?: TargetPeers
	) => void;

	replaceTrack: (
		oldTrack: MediaStreamTrack,
		newTrack: MediaStreamTrack,
		stream: MediaStream,
		targetPeers?: TargetPeers,
		meta?: StrictMetadata
	) => Promise<void[]> | undefined;

	onPeerJoin: (fn: (peerId: string) => void) => void;

	onPeerLeave: (fn: (peerId: string) => void) => void;

	onPeerError: (fn: (peerId: string, error: any) => void) => void;

	onPeerStream: (
		fn: (stream: MediaStream, peerId: string, metadata: StrictMetadata) => void
	) => void;

	onPeerTrack: (
		fn: (track: MediaStreamTrack, stream: MediaStream, peerId: string) => void
	) => void;
}

export interface ExtendedInstance extends Instance {
	__earlyDataBuffer: any;
	_channel: RTCDataChannel;
	__drainEarlyData: (onData: (data: any) => void) => void;
	_pc: RTCPeerConnection;
}

export type ActionsType = {
	onComplete: (
		data: any,
		peerId: string,
		metadata?: StrictMetadata
	) => void | (() => void);
	onProgress: (
		percent: number,
		peerId: string,
		metadata?: StrictMetadata
	) => void | (() => void);
};
