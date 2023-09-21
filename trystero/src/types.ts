import { FirebaseApp } from "firebase/app";
import { Instance } from "simple-peer";

export type Metadata =
	| null
	| string
	| number
	| boolean
	| undefined
	| Metadata[]
	| { [key: string]: Metadata };

export interface BaseRoomConfig {
	appId: string;
	password?: string;
	rtcConfig?: RTCConfiguration;
	encryptDecrypt?: {
		encrypt: (toId: string, data: Uint8Array) => Promise<Uint8Array>;
		decrypt: (fromId: string, data: Uint8Array) => Promise<Uint8Array>;
		hasKey: (id: string) => boolean;
		IV_LENGTH: number;
	};
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

export type TargetPeers = string | string[] | undefined;

export interface ActionSender {
	// TODO: change to use <T> for data type
	(
		data: any,
		targetPeers?: TargetPeers,
		metadata?: Metadata,
		progress?: (percent: number, peerId: string, metadata?: Metadata) => void
	): Promise<Array<any>>;
}

export interface ActionReceiver {
	// TODO: change to use <T> for data type
	(receiver: (data: any, peerId: string, metadata?: Metadata) => void): void;
}

export interface ActionProgress {
	(
		progressHandler: (
			percent: number,
			peerId: string,
			metadata?: Metadata
		) => void
	): void;
}

export type MakeAction = (
	// TODO: change to use <T> for snd/rec
	namespace: string
) => [ActionSender, ActionReceiver, ActionProgress];

export interface Room {
	makeAction: MakeAction;

	ping: (id: string) => Promise<number>;

	leave: () => void;

	getPeers: () => Record<string, RTCPeerConnection>;

	addStream: (
		stream: MediaStream,
		targetPeers?: TargetPeers,
		metadata?: Metadata
	) => Promise<void>[];

	removeStream: (stream: MediaStream, targetPeers?: TargetPeers) => void;

	addTrack: (
		track: MediaStreamTrack,
		stream: MediaStream,
		targetPeers?: TargetPeers,
		metadata?: Metadata
	) => Promise<void>[];

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
		meta?: Metadata
	) => Promise<void>[];

	onPeerJoin: (fn: (peerId: string) => void) => void;

	onPeerLeave: (fn: (peerId: string) => void) => void;

	onPeerStream: (
		fn: (stream: MediaStream, peerId: string, metadata: Metadata) => void
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
