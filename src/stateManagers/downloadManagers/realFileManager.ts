import shortid from "shortid";
import { create } from "zustand";

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
        ...Array.from(files).reduce((acc, file) => {
          acc[shortid.generate()] = file;
          return acc;
        }, {} as { [key: string]: File }),
      },
    })),
  deleteRealFile: (fileId: string) =>
    set((state) => {
      const { [fileId]: _, ...newRealFiles } = state.realFiles;
      return { realFiles: newRealFiles };
    }),
}));
