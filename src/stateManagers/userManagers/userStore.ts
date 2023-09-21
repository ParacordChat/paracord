import { create } from "zustand";
import { User } from "../../helpers/types";

interface UserStore {
  users: User[];
  addUser: (user: User) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
}

export const useUserStore = create<UserStore>((set) => ({
	users: [],
	addUser: (user: User) => set((state) => ({ users: [...state.users, user] })),
	updateUser: (id: string, updates: Partial<User>) =>
		set((state) => ({
			users: state.users.map((user) =>
				user.id === id ? { ...user, ...updates } : user
			)
		})),
	deleteUser: (id: string) =>
		set((state) => ({
			users: state.users.filter((user) => user.id !== id)
		}))
}));
