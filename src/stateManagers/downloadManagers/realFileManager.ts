import { create } from "zustand";
import { genId } from "../../helpers/utils";

interface RealFileStore {
	realFiles: { [fileId: string]: File };
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
					const newFiles: { [fileId: string]: File } = {};
					for (const file of files) {
						newFiles[genId(6)] = file;
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
