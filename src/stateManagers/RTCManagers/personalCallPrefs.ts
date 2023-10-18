import { create } from "zustand";

interface VideoBubble {
  id: string;
  stream: MediaStream;
  isAudioOnly: boolean;
  isViewOnly?: boolean;
}

interface ClientSideUserTraitsStore {
  isSharing: boolean;
  setIsSharing: (isSharing: boolean) => void;
  videoBubbles: VideoBubble[];
  addVideoBubble: (bubble: VideoBubble) => void;
  removeBubbleWithId: (id: string) => void;
  clearVideoBubbles: () => void;
  callConsent: boolean;
  setCallConsent: (callConsent: boolean) => void;
  myStream: MediaStream | null;
  setMyStream: (myStream: MediaStream | null) => void;
}

export const useCallPrefsState = create<ClientSideUserTraitsStore>(
  (set, get) => ({
    isSharing: false,
    setIsSharing: (isSharing) => set({ isSharing }),
    videoBubbles: [],
    addVideoBubble: (bubble) =>
      set({ videoBubbles: [...get().videoBubbles, bubble] }),
    removeBubbleWithId: (id) =>
      set({
        videoBubbles: get().videoBubbles.filter((bubble) => bubble.id !== id),
      }),
    clearVideoBubbles: () => set({ videoBubbles: [] }),
    callConsent: false,
    setCallConsent: (callConsent) => set({ callConsent }),
    myStream: null,
    setMyStream: (myStream) => set({ myStream }),
  }),
);
