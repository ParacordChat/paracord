import * as kyber from "pqc-kyber";
import { decodeBytes, encodeBytes } from "../dataHandling/uint8util";

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

export function encryptData(secretData: Uint8Array, sharedSecret: Uint8Array) {
	const dataEncoded = decodeBytes(secretData);
	const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

	return getPasswordKey(sharedSecret)
		.then((passwordKey) => {
			const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
			return deriveKey(passwordKey, salt, ["encrypt"])
				.then((aesKey) => {
					return window.crypto.subtle.encrypt(
						{
							name: algo,
							iv
						},
						aesKey,
						encodeBytes(dataEncoded)
					);
				})
				.then((encryptedContent) => {
					const encryptedContentArr = new Uint8Array(encryptedContent);
					const buff = new Uint8Array(
						salt.byteLength + iv.byteLength + encryptedContentArr.byteLength
					);
					buff.set(salt, 0);
					buff.set(iv, salt.byteLength);
					buff.set(encryptedContentArr, salt.byteLength + iv.byteLength);
					return buff;
				});
		})
		.catch((error) => {
			console.error(error);
			throw error;
		});
}

export function decryptData(
	encryptedDataBuff: Uint8Array,
	sharedSecret: Uint8Array
) {
	const salt = encryptedDataBuff.slice(0, SALT_LENGTH);
	const iv = new Uint8Array(
		encryptedDataBuff.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
	);
	const data = encryptedDataBuff.slice(SALT_LENGTH + IV_LENGTH);
	return getPasswordKey(sharedSecret)
		.then((passwordKey) => deriveKey(passwordKey, salt, ["decrypt"]))
		.then((aesKey) =>
			window.crypto.subtle.decrypt(
				{
					name: algo,
					iv
				},
				aesKey,
				data
			)
		)
		.then((decryptedContent) => new Uint8Array(decryptedContent))
		.catch((error) => {
			console.error(error);
			throw error;
		});
}
