import { create } from "zustand";
import { User } from "../../helpers/types";

interface UserStore {
  users: User[];
  keyedUsers: Set<string>; // id list
  addUser: (user: User) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
}

export const useUserStore = create<UserStore>((set) => ({
	users: [],
	keyedUsers: new Set(),
	addUser: (user: User) => set((state) => ({ users: [...state.users, user] })),
	updateUser: (id: string, updates: Partial<User>) =>
		set((state) => ({
			users: state.users.map((user) =>
				user.id === id ? { ...user, ...updates } : user
			),
			keyedUsers: updates.quantumRecv
				? state.keyedUsers.add(id)
				: state.keyedUsers
		})),
	deleteUser: (id: string) =>
		set((state) => {
			if (state.keyedUsers.has(id)) state.keyedUsers.delete(id);
			return {
				users: state.users.filter((user) => user.id !== id),
				keyedUsers: state.keyedUsers
			};
		})
}));
