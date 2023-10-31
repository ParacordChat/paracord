import { create } from "zustand";

interface ClientSideUserTraitsStore {
	unreadMessages: number;
	incrementUnreadMessages: () => void;
	resetUnreadMessages: () => void;
	activeTab: string;
	setActiveTab: (tab: string) => void;
	roomPassword: string | undefined;
	setPassword: (password: string) => void;
	disappearingMessagesLength: number;
	setDisappearingMessagesLength: (length: number) => void;
	mutedUsers: { [userId: string]: boolean };
	toggleMute: (userId: string) => void;
	addUser: (userId: string) => void;
	removeUser: (userId: string) => void;
	typingUsers: string[];
	addTypingUser: (userId: string) => void;
	removeTypingUser: (userId: string) => void;
}

export const useClientSideUserTraits = create<ClientSideUserTraitsStore>(
	(set, get) => ({
		unreadMessages: 0,
		incrementUnreadMessages: () =>
			set((state) => ({ unreadMessages: state.unreadMessages + 1 })),
		resetUnreadMessages: () => set({ unreadMessages: 0 }),

		activeTab: "chat",
		setActiveTab: (tab: string) => set({ activeTab: tab }),

		roomPassword: undefined,
		setPassword: (password: string) => set({ roomPassword: password }),

		disappearingMessagesLength: 1000,
		setDisappearingMessagesLength: (length: number) =>
			set({ disappearingMessagesLength: length }),

		mutedUsers: {},
		toggleMute: (userId: string) =>
			set((state) => ({
				mutedUsers: {
					...state.mutedUsers,
					[userId]: !state.mutedUsers[userId]
				}
			})),
		addUser: (userId: string) =>
			set((state) => ({
				mutedUsers: { ...state.mutedUsers, [userId]: false }
			})),
		removeUser: (userId: string) =>
			set((state) => {
				const { [userId]: _, ...rest } = state.mutedUsers;
				return { mutedUsers: rest };
			}),

		typingUsers: [],
		addTypingUser: (userId: string) => {
			if (get().typingUsers.includes(userId)) return;
			set((state) => ({
				typingUsers: [...state.typingUsers, userId]
			}));
		},
		removeTypingUser: (userId: string) =>
			set((state) => ({
				typingUsers: state.typingUsers.filter((id) => id !== userId)
			}))
	})
);
