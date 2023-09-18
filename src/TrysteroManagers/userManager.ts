import { funAnimalName } from "fun-animal-names";
import * as kyber from "pqc-kyber";
import { Room } from "trystero";
import { sendSystemMessage } from "../helpers/helpers";
import { useProgressStore } from "../stateManagers/downloadManagers/progressManager";
import { useOfferStore } from "../stateManagers/downloadManagers/requestManager";
import { useClientSideUserTraits } from "../stateManagers/userManagers/clientSideUserTraits";
import { usePersonaStore } from "../stateManagers/userManagers/personaStore";
import { useUserStore } from "../stateManagers/userManagers/userStore";

export default class UserManager {
  //TODO: re-add kyber-crystals pqc
  private sendName;
  private sendEncryptionInfo;

  constructor({ room, roomId }: { room: Room; roomId: string }) {
    const [sendName, getName] = room.makeAction("name"); //TODO: maybe encrypt later
    const [sendEncryptionInfo, getEncryptionInfo] = room.makeAction("encReq");
    const [sendProcessedKey, getProcessedKey] = room.makeAction("encProc");

    this.sendName = sendName;
    this.sendEncryptionInfo = sendEncryptionInfo;

    room.onPeerJoin(async (id: string) => {
      this.syncInfo(id);
      useUserStore
        .getState()
        .addUser({ id, roomId, active: true, name: funAnimalName(id) });
      useClientSideUserTraits.getState().addUser(id);
      sendSystemMessage(roomId, `${id} joined the room`);
    });

    room.onPeerLeave((id: string) => {
      useUserStore.getState().updateUser(id, { active: false });

      const peerOffers = useOfferStore.getState().requestableDownloads[id];
      peerOffers?.forEach((offer: { id: string }) =>
        useProgressStore.getState().deleteProgress(offer.id)
      );

      useOfferStore.getState().removeRequestablesForId(id);
      useClientSideUserTraits.getState().removeUser(id);
      sendSystemMessage(roomId, `${id} left the room`);
    });

    getName((name: string, id: string) => {
      useUserStore.getState().updateUser(id, { name: name });
    });

    getEncryptionInfo(async (key: Uint8Array, id: string) => {
      if (!key) {
        return;
      }

      try {
        const { ciphertext, sharedSecret } = await kyber.encapsulate(key);
        useUserStore.getState().updateUser(id, { quantumSend: sharedSecret });
        sendProcessedKey(ciphertext, id);
      } catch (e) {
        console.error(e);
      }
    });

    getProcessedKey(async (cyphertext: Uint8Array, id: string) => {
      if (!cyphertext) {
        return;
      }
      const activePersona = usePersonaStore.getState().persona;
      if (activePersona) {
        this.sendName(activePersona.name);
        if (activePersona.keyPair) {
          const key = kyber.decapsulate(
            cyphertext,
            activePersona.keyPair.secret
          );
          try {
            useUserStore.getState().updateUser(id, { quantumRecv: key });
          } catch (e) {
            console.error(e);
          }
        }
      }
    });
  }

  syncInfo = async (id?: string) => {
    //ID is only defined if initiating connection
    const activePersona = usePersonaStore.getState().persona;
    if (activePersona) {
      this.sendName(activePersona.name);
      if (activePersona.keyPair) {
        await this.sendEncryptionInfo(activePersona.keyPair.pubkey, id);
      }
    }
  };

  setMyName = (name: string) => {
    usePersonaStore.getState().updatePersona({ name });
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
    await usePersonaStore.getState().createPersona();
    this.syncInfo();
  };
}
