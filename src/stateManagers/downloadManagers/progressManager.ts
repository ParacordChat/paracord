import { create } from "zustand";
import { FileProgress } from "../../helpers/types";

export interface QueuedWritable {
  fileId: string;
  uuid: string;
  writable: FileSystemWritableFileStream;
}

interface ProgressStore {
  progressQueue: FileProgress[];
  writablesQueue: QueuedWritable[];
  addWritable: (writeHook: QueuedWritable) => void;
  removeWritable: (uuid: string) => void;
  addProgress: (progress: FileProgress) => void;
  deleteProgress: (fileId: string) => void;
  updateProgress: (uuid: string, updates: Partial<FileProgress>) => void;
  removeFile: (id: string) => void;
}

export const useProgressStore = create<ProgressStore>((set) => ({
	progressQueue: [],

	addProgress: (progress: FileProgress) =>
		set((state) => ({
			progressQueue: [...state.progressQueue, progress]
		})),
	deleteProgress: (uuid: string) =>
		set((state) => ({
			progressQueue: state.progressQueue.filter(
				(progress) => progress.uuid !== uuid
			)
		})),
	updateProgress: (uuid: string, updates: Partial<FileProgress>) =>
		set((state) => {
			return {
				progressQueue: state.progressQueue.map((progress) =>
					uuid === progress.uuid ? { ...progress, ...updates } : progress
				)
			};
		}),
	writablesQueue: [],
	addWritable: (writeHook: QueuedWritable) =>
		set((state) => {
			state.writablesQueue.push(writeHook);
			return { writablesQueue: state.writablesQueue };
		}),
	removeWritable: (uuid: string) => {
		set((state) => {
			state.writablesQueue = state.writablesQueue.filter((writable) => {
				if (writable.uuid === uuid) {
					writable.writable.close();
					return false;
				}
				return true;
			});
			return { writablesQueue: state.writablesQueue };
		});
	},
	removeFile: (id: string) =>
		set((state) => ({
			progressQueue: state.progressQueue.filter(
				(progress) => progress.id !== id
			),
			writablesQueue: state.writablesQueue.filter((writable) => {
				if (writable.fileId === id) {
					writable.writable.close();
					return false;
				}
				return true;
			})
		}))
}));
