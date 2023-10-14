import { create } from "zustand";
import { FileProgress } from "../../helpers/types";

interface ProgressStore {
	progressQueue: FileProgress[];
	writablesQueue: { [uuid: string]: FileSystemWritableFileStream };
	addWritable: (uuid: string, writable: FileSystemWritableFileStream) => void;
	removeWritable: (fid: string) => void;
	addProgress: (progress: FileProgress) => void;
	deleteProgress: (fileId: string) => void;
	updateProgress: (uuid: string, updates: Partial<FileProgress>) => void;
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
	writablesQueue: {},
	addWritable: (uuid: string, writable: FileSystemWritableFileStream) =>
		set((state) => {
			state.writablesQueue[uuid] = writable;
			console.log("addedwrt", uuid, writable);
			return { writablesQueue: state.writablesQueue };
		}),
	removeWritable: (fid: string) => {
		set((state) => {
			state.writablesQueue[fid].close();
			delete state.writablesQueue[fid];
			return { writablesQueue: state.writablesQueue };
		});
	}
}));
