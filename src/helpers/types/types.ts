export type FileMetaData = {
	id: string;
	uuid: string;
	chunkN: number;
	name: string;
	size: number;
	last: boolean;
};

export interface User {
	id: string;
	roomId: string;
	active: boolean;
	quantumSend?: Uint8Array;
	quantumRecv?: Uint8Array;
	name: string;
}

export interface Message {
	id: string;
	text: string;
	sentAt: number;
	roomId: string;
	sentBy: string;
	recievedAt: number;
}

export interface FileOffer {
	id: string;
	name: string;
	size: number;
	ownerId: string;
}

export interface FileAck {
	uuid: string;
	id: string;
	chunkN: number;
}

export interface FileRequest {
	id: string;
	uuid: string;
}

export interface FileProgress {
	id: string;
	uuid: string;
	name: string;
	chunkN: number;
	progress: number;
	toUser: string; // id of user
}

export type KyberKeypair = {
	publicKey: Uint8Array;
	privateKey: Uint8Array;
};

export interface Persona {
	keyPair: KyberKeypair | undefined;
	name: string;
}
