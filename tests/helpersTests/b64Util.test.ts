import { expect, it, test } from "vitest";
import {
	base64ToBytes,
	bytesToBase64
} from "../../src/helpers/dataHandling/b64util";

test("bytesToBase64", () => {
	it("should convert bytes to base64", () => {
		const bytes = new Uint8Array([
			72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100
		]);
		const expectedBase64 = "SGVsbG8gV29ybGQ=";
		const result = bytesToBase64(bytes);
		expect(result)
			.toEqual(expectedBase64);
	});
});

test("base64ToBytes", () => {
	it("should convert base64 to bytes", () => {
		const base64 = "SGVsbG8gV29ybGQ=";
		const expectedBytes = new Uint8Array([
			72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100
		]);
		const result = base64ToBytes(base64);
		expect(result)
			.toEqual(expectedBytes);
	});
});
