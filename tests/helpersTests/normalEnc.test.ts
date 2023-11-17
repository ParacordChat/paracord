import { expect, it, test } from "vitest";
import {
	decrypt,
	encrypt,
	genKey
} from "../../src/helpers/cryptography/crypto";

test("generateKeyPair", () => {
	it("should generate a key pair", async () => {
		const keyPair = await genKey("test", "test");
		expect(keyPair.type)
			.toBe("secret");
	});
});

test("encrypt and decrypt", () => {
	it("should encrypt and decrypt the data", async () => {
		const keyPair = await genKey("test", "test");
		const data = "Hello, World!";
		const encryptedData = await encrypt(keyPair, data);
		const decryptedData = decrypt(keyPair, JSON.parse(encryptedData));
		expect(decryptedData)
			.toBe(data);
	});
});

test("stub", () => {
	it("should pass", () => {
		expect(true)
			.toBe(true);
	});
});

// TODO: going MAD because I can't use wasm in vitest
