import { funAnimalName } from "fun-animal-names";
import * as kyber from "pqc-kyber";
import { Room, selfId } from "trystero";
import { sendSystemMessage } from "../helpers/helpers";
import { useProgressStore } from "../stateManagers/downloadManagers/progressManager";
import { useOfferStore } from "../stateManagers/downloadManagers/requestManager";
import { useClientSideUserTraits } from "../stateManagers/userManagers/clientSideUserTraits";
import { usePersonaStore } from "../stateManagers/userManagers/personaStore";
import { useUserStore } from "../stateManagers/userManagers/userStore";

export default class UserManager {
	private sendName;
	private sendEncryptionInfo;

	constructor({ room, roomId }: { room: Room; roomId: string }) {
		const [sendName, getName] = room.makeAction("name", true);
		const [sendEncryptionInfo, getEncryptionInfo] = room.makeAction("encReq");
		const [sendProcessedKey, getProcessedKey] = room.makeAction("encProc");

		this.sendName = sendName;
		this.sendEncryptionInfo = sendEncryptionInfo;

		room.onPeerJoin(async (id: string) => {
			this.syncInfo(id);
			useUserStore
				.getState()
				.addUser({ id, roomId, active: true, name: funAnimalName(id) });
			useClientSideUserTraits.getState()
				.addUser(id);
			sendSystemMessage(roomId, `${id} joined the room`);
		});

		useUserStore.subscribe((state, prevState) => {
			if (state.keyedUsers.size > prevState.keyedUsers.size) {
				this.syncInfo();
			}
		});

		room.onPeerLeave((id: string) => {
			useUserStore.getState()
				.updateUser(id, { active: false });

			const peerOffers = useOfferStore.getState().requestableDownloads[id];
			peerOffers?.forEach((offer: { id: string }) =>
				useProgressStore.getState()
					.deleteProgress(offer.id)
			);

			useOfferStore.getState()
				.removeRequestablesForId(id);

			useClientSideUserTraits.getState()
				.removeUser(id);

			sendSystemMessage(roomId, `${id} left the room`);
		});

		getName((name: string, id: string) => {
			useUserStore.getState()
				.updateUser(id, { name });
		});

		getEncryptionInfo(async (key: Uint8Array, id: string) => {
			if (!key) {
				return;
			}

			try {
				const { ciphertext, sharedSecret } = await kyber.encapsulate(key);
				console.log(id, key, ciphertext, sharedSecret);
				useUserStore.getState()
					.updateUser(id, { quantumSend: sharedSecret });
				sendProcessedKey(ciphertext, id);
			} catch (error) {
				console.error(error); // TODO: mystery null error here
			}
		});

		getProcessedKey(async (cyphertext: Uint8Array, id: string) => {
			if (!cyphertext) {
				return;
			}
			const activePersona = usePersonaStore.getState().persona;
			if (activePersona && activePersona.keyPair) {
				const key = kyber.decapsulate(cyphertext, activePersona.keyPair.secret);
				try {
					console.log("quantum bootstrap achieved", id, selfId);
					useUserStore.getState()
						.updateUser(id, { quantumRecv: key });
				} catch (error) {
					console.error(error);
				}
			}
		});
	}

	syncInfo = async (id?: string) => {
		// ID is only defined if initiating connection
		const activePersona = usePersonaStore.getState().persona;
		const allowedSendNames = useUserStore.getState().keyedUsers;
		if (activePersona) {
			if (id) {
				if (activePersona.keyPair) {
					await this.sendEncryptionInfo(activePersona.keyPair.pubkey, id);
				}
				if (allowedSendNames.has(id)) {
					this.sendName(activePersona.name, id);
				}
			} else {
				if (activePersona.keyPair) {
					await this.sendEncryptionInfo(activePersona.keyPair.pubkey);
				}
				this.sendName(activePersona.name);
			}
		}
	};

	setMyName = (name: string) => {
		usePersonaStore.getState()
			.updatePersona({ name });
		this.syncInfo();
	};

	// setEncryptionInfo = (info: {
	//   privateKey: Uint8Array;
	//   publicKey: Uint8Array;
	// }) => {
	//   usePersonaStore.getState().updatePersona({ keyPair: info as Keys });
	//   this.syncInfo();
	// };

	createPersona = async () => {
		await usePersonaStore.getState()
			.createPersona();
		this.syncInfo();
	};
}
