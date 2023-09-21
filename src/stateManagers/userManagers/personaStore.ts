import { funAnimalName } from "fun-animal-names";
import { selfId } from "trystero";
import { create } from "zustand";
import { generateKeyPair } from "../../helpers/cryptoSuite";
import { randomName } from "../../helpers/helpers";
import { Persona } from "../../helpers/types";

interface PersonaStore {
  persona: Persona;
  updatePersona: (updates: Partial<Persona>) => void;
  resetPersona: () => void;
  createPersona: () => void;
}

export const usePersonaStore = create<PersonaStore>((set) => ({
	persona: {
		name: randomName(),
		keyPair: undefined
	},
	createPersona: () =>
		set((_state) => ({
			persona: {
				name: funAnimalName(selfId),
				keyPair: generateKeyPair()
			}
		})),
	updatePersona: (updates: Partial<Persona>) =>
		set((state) => ({ persona: { ...state.persona, ...updates } })),
	resetPersona: () =>
		set((_state) => ({
			persona: {
				name: randomName(),
				keyPair: generateKeyPair()
			}
		}))
}));
