import { create } from "zustand";
import { FileProgress } from "../../helpers/types/types";

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
  deleteProgress: (uuid: string) => void;
  deleteFid: (fid: string) => void;
  updateOrAddProgress: (uuid: string, updates: FileProgress) => void;
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
	deleteFid: (fid: string) =>
		set((state) => ({
			progressQueue: state.progressQueue.filter(
				(progress) => progress.id !== fid
			)
		})),
	updateOrAddProgress: (uuid: string, updates: FileProgress) =>
		set((state) => {
			const fileReq = state.progressQueue.filter(
				(progress) => progress.uuid === uuid
			);
			return fileReq.length === 0
				? {
						progressQueue: [...state.progressQueue, { ...updates }]
					}
				: {
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
