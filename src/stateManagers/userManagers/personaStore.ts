import { create } from "zustand";
import { generateKeyPair } from "../../helpers/cryptoSuite";
import { Persona } from "../../helpers/types";

interface PersonaStore {
  persona: Persona;
  updatePersona: (updates: Partial<Persona>) => void;
  resetPersona: () => void;
}

export const usePersonaStore = create<PersonaStore>((set) => ({
  persona: {
    name: "Anonymous",
    keyPair: undefined,
  },
  updatePersona: (updates: Partial<Persona>) =>
    set((state) => ({ persona: { ...state.persona, ...updates } })),
  resetPersona: () =>
    set((_state) => ({
      persona: {
        name: "Anonymous",
        keyPair: generateKeyPair(),
      },
    })),
}));
