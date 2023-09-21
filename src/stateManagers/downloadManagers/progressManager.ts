import { create } from "zustand";
import { FileProgress } from "../../helpers/types";

interface ProgressStore {
  progressQueue: FileProgress[];

  addProgress: (progress: FileProgress) => void;
  deleteProgress: (fileId: string) => void;
  updateProgress: (fileId: string, updates: Partial<FileProgress>) => void;
}

export const useProgressStore = create<ProgressStore>((set) => ({
	progressQueue: [],

	addProgress: (progress: FileProgress) =>
		set((state) => ({
			progressQueue: [...state.progressQueue, progress]
		})),
	deleteProgress: (fileId: string) =>
		set((state) => ({
			progressQueue: state.progressQueue.filter(
				(progress) => progress.id !== fileId
			)
		})),
	updateProgress: (fileId: string, updates: Partial<FileProgress>) =>
		set((state) => ({
			progressQueue: state.progressQueue.map((progress) =>
				progress.id === fileId ? { ...progress, ...updates } : progress
			)
		}))
}));
