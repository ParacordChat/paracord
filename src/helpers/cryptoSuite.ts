import * as kyber from "pqc-kyber";
import { useUserStore } from "../stateManagers/userManagers/userStore";
import { User } from "./types";

// Function to generate a public-private key pair
export const generateKeyPair = () => kyber.keypair();

const algo = "AES-GCM";
const IV_LENGTH = 12;
const SALT_LENGTH = 16;

const getPasswordKey = (password: Uint8Array) =>
	window.crypto.subtle.importKey("raw", password, "PBKDF2", false, [
		"deriveKey"
	]);

const deriveKey = (
	passwordKey: CryptoKey,
	salt: Uint8Array,
	keyUsage: Iterable<KeyUsage>
) =>
	window.crypto.subtle.deriveKey(
		{
			name: "PBKDF2",
			salt,
			iterations: 250_000,
			hash: "SHA-256"
		},
		passwordKey,
		{ name: algo, length: 256 },
		false,
		keyUsage
	);

const enc = new TextEncoder();
const dec = new TextDecoder();

async function encryptData(secretData: Uint8Array, sharedSecret: Uint8Array) {
	try {
		const dataEncoded = dec.decode(secretData);
		const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
		const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
		const passwordKey = await getPasswordKey(sharedSecret);
		const aesKey = await deriveKey(passwordKey, salt, ["encrypt"]);
		const encryptedContent = await window.crypto.subtle.encrypt(
			{
				name: algo,
				iv
			},
			aesKey,
			enc.encode(dataEncoded)
		);

		const encryptedContentArr = new Uint8Array(encryptedContent);
		const buff = new Uint8Array(
			salt.byteLength + iv.byteLength + encryptedContentArr.byteLength
		);
		buff.set(salt, 0);
		buff.set(iv, salt.byteLength);
		buff.set(encryptedContentArr, salt.byteLength + iv.byteLength);
		return buff;
	} catch (error) {
		console.error(error);
		throw error;
	}
}

async function decryptData(
	encryptedDataBuff: Uint8Array,
	sharedSecret: Uint8Array
) {
	try {
		const salt = encryptedDataBuff.slice(0, SALT_LENGTH);
		const iv = new Uint8Array(
			encryptedDataBuff.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
		);
		const data = encryptedDataBuff.slice(SALT_LENGTH + IV_LENGTH);
		const passwordKey = await getPasswordKey(sharedSecret);
		const aesKey = await deriveKey(passwordKey, salt, ["decrypt"]);
		const decryptedContent = await window.crypto.subtle.decrypt(
			{
				name: algo,
				iv
			},
			aesKey,
			data
		);
		const res = new Uint8Array(decryptedContent);
		return res;
	} catch (error) {
		console.error(error);
		throw error;
	}
}

const findUserAndEncrypt = async (toId: string, data: Uint8Array) => {
	const sendKey = useUserStore
		.getState()
		.users.find((user: User) => user.id === toId)?.quantumSend;
	if (!sendKey || data.byteLength === 0) return data;
	return await encryptData(data, sendKey);
};

const findUserAndDecrypt = async (fromId: string, data: Uint8Array) => {
	const recKey = useUserStore
		.getState()
		.users.find((user: User) => user.id === fromId)?.quantumRecv;
	if (!recKey || data.byteLength < IV_LENGTH + 1) return data;
	return await decryptData(data, recKey);
};

export const ecPeerlist = () => [...useUserStore.getState().keyedUsers];

export const encryptDecrypt = {
	encrypt: findUserAndEncrypt,
	decrypt: findUserAndDecrypt,
	ecPeerlist
};

// (() => {
//   const text = "pongo";
//   const encKey = new Uint8Array(32);
//   encKey.fill(1);

//   console.log(encKey);

//   encryptData(enc.encode(text), encKey).then((encod) => {
//     console.log("exr", encod);
//     decryptData(encod, encKey).then((decod) => {
//       console.log("dxr", dec.decode(decod));
//     });
//   });
// })(); //crypto test
// https://github.com/bradyjoslin/webcrypto-example/blob/master/script.js
