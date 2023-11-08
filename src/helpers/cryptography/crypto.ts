import { decodeBytes, encodeBytes } from "../dataHandling/uint8util";

const algo = "AES-GCM";
const IV_LENGTH = 16;

const pack = (buff: ArrayBufferLike) =>
	btoa(String.fromCodePoint(...new Uint8Array(buff)));

const unpack = (packed: string) => {
	const str = window.atob(packed);

	return new Uint8Array(str.length)
		.map((_, i) => str.codePointAt(i)!).buffer;
};

export const generateKeyPair = async (key: Uint8Array) =>
	crypto.subtle.importKey(
		"raw",
		await crypto.subtle.digest({ name: "SHA-256" }, key),
		{ name: algo },
		false,
		["encrypt", "decrypt"]
	);

export const genKey = async (secret: any, ns: any) =>
	generateKeyPair(encodeBytes(`${secret}:${ns}`));

export const encrypt = async (
	keyP: CryptoKey | PromiseLike<CryptoKey>,
	plaintext: string
) => {
	const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

	return crypto.subtle
		.encrypt({ name: algo, iv }, await keyP, encodeBytes(plaintext))
		.then((encBytes) =>
			JSON.stringify({
				c: pack(encBytes),
				iv: [...iv]
			})
		);
};

export const decrypt = async (
	keyP: CryptoKey | PromiseLike<CryptoKey>,
	raw: { c: string; iv: number[] }
) => {
	const { c, iv } = raw;
	const fullKey = await keyP;

	return crypto.subtle
		.decrypt({ name: algo, iv: new Uint8Array(iv) }, fullKey, unpack(c))
		.then((decBytes) => decodeBytes(decBytes));
};
