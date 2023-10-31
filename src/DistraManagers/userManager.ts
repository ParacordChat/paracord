import { funAnimalName } from "fun-animal-names";
import * as kyber from "pqc-kyber";
import { Room } from "../Distra";
import { sendSystemMessage } from "../helpers/helpers";
import { useProgressStore } from "../stateManagers/downloadManagers/progressManager";
import { useOfferStore } from "../stateManagers/downloadManagers/requestManager";
import { useClientSideUserTraits } from "../stateManagers/userManagers/clientSideUserTraits";
import { usePersonaStore } from "../stateManagers/userManagers/personaStore";
import { useUserStore } from "../stateManagers/userManagers/userStore";

export default class UserManager {
	private sendName;
	private sendEncryptionInfo;
	private roomId: string;

	constructor({ room, roomId }: { room: Room; roomId: string }) {
		const [sendName, getName] = room.makeAction<string>("name", true);
		const [sendEncryptionInfo, getEncryptionInfo] =
      room.makeAction<Uint8Array>("encReq");
		const [sendProcessedKey, getProcessedKey] =
      room.makeAction<Uint8Array>("encProc");

		this.sendName = sendName;
		this.sendEncryptionInfo = sendEncryptionInfo;
		this.roomId = roomId;

		useUserStore.subscribe((state, prevState) => {
			if (state.keyedUsers.size > prevState.keyedUsers.size) {
				this.syncInfo();
			}
		});

		room.onPeerError((id: string, error: Error) => {
			console.log(id, "_", error);
			// sendSystemMessage(roomId, `${id} left the room`);
		});

		room.onPeerLeave((id: string) => {
			useUserStore.getState()
				.updateUser(id, { active: false });

			const peerOffers = useOfferStore.getState().requestableDownloads[id];
			peerOffers?.forEach((offer: { id: string }) =>
				useProgressStore.getState()
					.removeFile(offer.id)
			);

			useOfferStore.getState()
				.removeRequestablesForId(id);

			useClientSideUserTraits.getState()
				.removeUser(id);

			sendSystemMessage(roomId, `${funAnimalName(id)} left the room`);
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
				useUserStore.getState()
					.updateUser(id, { quantumSend: sharedSecret });
				sendProcessedKey(ciphertext, id);
			} catch (error) {
				console.error(error);
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
					useUserStore.getState()
						.updateUser(id, { quantumRecv: key });
				} catch (error) {
					console.error(error);
				}
			}
		});
	}

	public peerJoinHook = async (id: string) => {
		this.syncInfo(id);
		useUserStore.getState()
			.addUser({
				id,
				roomId: this.roomId,
				active: true,
				name: funAnimalName(id)
			});
		useClientSideUserTraits.getState()
			.addUser(id);
		sendSystemMessage(this.roomId, `${funAnimalName(id)} joined the room`);
	};

	syncInfo = async (id?: string) => {
		// ID is only defined if initiating connection
		const activePersona = usePersonaStore.getState().persona;
		if (activePersona) {
			if (id) {
				if (activePersona.keyPair) {
					await this.sendEncryptionInfo(activePersona.keyPair.pubkey, id);
				}
				const allowedSendNames = useUserStore.getState().keyedUsers;
				if (allowedSendNames.has(id)) {
					this.sendName(activePersona.name, id);
				}
			} else {
				if (useClientSideUserTraits.getState().roomPassword) {
					if (activePersona.keyPair) {
						await this.sendEncryptionInfo(activePersona.keyPair.pubkey);
						this.sendName(activePersona.name);
					}
				} else {
					this.sendName(activePersona.name);
				}
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
