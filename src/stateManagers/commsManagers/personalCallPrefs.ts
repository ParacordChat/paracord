import { create } from "zustand";

interface VideoBubble {
	id: string;
	stream: MediaStream;
	isAudioOnly: boolean;
	isViewOnly?: boolean;
}

interface ClientSideUserTraitsStore {
	myStream?: MediaStream;
	setMyStream: (myStream: MediaStream | undefined) => void;
	isSharing: boolean;
	setIsSharing: (isSharing: boolean) => void;
	videoBubbles: VideoBubble[];
	addVideoBubble: (bubble: VideoBubble) => void;
	removeBubbleWithId: (id: string) => void;
	clearVideoBubbles: () => void;
	callConsent: boolean;
	setCallConsent: (callConsent: boolean) => void;
}

export const useCallPrefsState = create<ClientSideUserTraitsStore>(
	(set, get) => ({
		myStream: undefined,
		setMyStream: (myStream) => set({ myStream }),
		isSharing: false,
		setIsSharing: (isSharing) => set({ isSharing }),
		videoBubbles: [],
		addVideoBubble: (bubble) =>
			set({ videoBubbles: [...get().videoBubbles, bubble] }),
		removeBubbleWithId: (id) =>
			set({
				videoBubbles: get().videoBubbles.filter((bubble) => bubble.id !== id)
			}),
		clearVideoBubbles: () => set({ videoBubbles: [] }),
		callConsent: false,
		setCallConsent: (callConsent) => set({ callConsent })
	})
);
