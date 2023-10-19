import * as kyber from "pqc-kyber";
import { useUserStore } from "../../stateManagers/userManagers/userStore";
import { User } from "../types/types";
import { decodeBytes, encodeBytes } from "../utils";

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

async function encryptData(secretData: Uint8Array, sharedSecret: Uint8Array) {
	try {
		const dataEncoded = decodeBytes(secretData);
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
			encodeBytes(dataEncoded)
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

export const findUserAndEncrypt = async (toId: string, data: Uint8Array) => {
	const sendKey = useUserStore
		.getState()
		.users.find((user: User) => user.id === toId)?.quantumSend;
	if (!sendKey || data.byteLength === 0) return data;
	return await encryptData(data, sendKey);
};

export const findUserAndDecrypt = async (fromId: string, data: Uint8Array) => {
	const recKey = useUserStore
		.getState()
		.users.find((user: User) => user.id === fromId)?.quantumRecv;
	if (!recKey || data.byteLength < IV_LENGTH + 1) return data;
	return await decryptData(data, recKey);
};
