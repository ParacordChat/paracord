import { Keys } from "pqc-kyber";

export type FileMetaData = {
  id: string;
  owner?: string;
  name: string;
  size: number;
};

export interface User {
  id: string;
  roomId: string;
  active: boolean;
  quantumSend?: Uint8Array;
  quantumRecv?: Uint8Array;
  name: string | "Anonymous";
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

export interface FileProgress {
  id: string;
  name: string;
  progress: number;
  toMe: boolean;
}

export interface Persona {
  keyPair: Keys | undefined;
  name: string | "Anonymous";
}
