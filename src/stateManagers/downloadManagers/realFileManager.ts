import { create } from "zustand";
import { uuidSource } from "../../helpers/helpers";

interface RealFileStore {
	realFiles: { [key: string]: File };
	addRealFiles: (file: File[]) => void;
	deleteRealFile: (fileId: string) => void;
}

export const useRealFiles = create<RealFileStore>((set) => ({
	realFiles: {},
	addRealFiles: (files: File[]) =>
		set((state) => ({
			realFiles: {
				...state.realFiles,
				...(() => {
					const newFiles: { [key: string]: File } = {};
					for (const file of files) {
						newFiles[uuidSource.new()] = file;
					}
					return newFiles;
				})()
			}
		})),
	deleteRealFile: (fileId: string) =>
		set((state) => {
			const { [fileId]: _, ...newRealFiles } = state.realFiles;
			return { realFiles: newRealFiles };
		})
}));
