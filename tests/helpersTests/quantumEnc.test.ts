import { expect, it, test } from "vitest";
// import {
// 	decryptData,
// 	encryptData,
// 	generateKeyPair
// } from "../src/helpers/cryptography/cryptoSuite";
// import {
// 	decodeBytes,
// 	encodeBytes
// } from "../src/helpers/dataHandling/uint8util";

// test("generateKeyPair", () => {
// 	it("should generate a valid key pair", async () => {
// 		const keyPair = await generateKeyPair();
// 		expect(keyPair.publicKey)
// 			.toBeDefined();
// 		expect(keyPair.privateKey)
// 			.toBeDefined();
// 	});
// });

// test("encryptData", () => {
// 	it("should encrypt and decrypt data correctly", () => {
// 		const text = "pongo";
// 		const encKey = new Uint8Array(32);
// 		encKey.fill(1);

// 		console.log(encKey);

// 		encryptData(encodeBytes(text), encKey)
// 			.then((encod) => {
// 				console.log("exr", encod);
// 				decryptData(encod, encKey)
// 					.then((decod) => {
// 						console.log("dxr", decodeBytes(decod));
// 					});
// 			});
// 	});
// });

test("stub", () => {
	it("should pass", () => {
		expect(true)
			.toBe(true);
	});
});

// TODO: going MAD because I can't use wasm in vitest
