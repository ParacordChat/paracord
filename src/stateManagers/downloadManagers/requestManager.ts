import { create } from "zustand";
import { FileOffer } from "../../helpers/types";

interface OfferStore {
  requestableDownloads: { [key: string]: FileOffer[] };
  updateOrAddRequestable: (id: string, offers: FileOffer[]) => void;
  removeRequestablesForId: (id: string) => void;
}

export const useOfferStore = create<OfferStore>((set) => ({
	requestableDownloads: {},

	updateOrAddRequestable: (id: string, offers: FileOffer[]) =>
		set((state) => ({
			requestableDownloads: {
				...state.requestableDownloads,
				[id]: offers
			}
		})),
	removeRequestablesForId: (id: string) =>
		set((state) => ({
			requestableDownloads: (() => {
				const requestables = state.requestableDownloads;
				if (id in requestables) delete requestables[id];
				return requestables;
			})()
		}))
}));
