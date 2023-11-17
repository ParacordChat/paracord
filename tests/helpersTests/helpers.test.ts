import { expect, it, test, vi } from "vitest";
import {
	confirmDialog,
	fancyBytes,
	generateHexColorFromString,
	isRtcSupported,
	randomName
} from "../../src/helpers/helpers";

test("confirmDialog", () => {
	it("should return true if user confirms", () => {
		const mockConfirm = vi.fn(() => true);
		window.confirm = mockConfirm;
		const result = confirmDialog("Are you sure?");
		expect(mockConfirm)
			.toHaveBeenCalledWith("Are you sure?");
		expect(result)
			.toBe(true);
	});

	it("should return false if user cancels", () => {
		const mockConfirm = vi.fn(() => false);
		window.confirm = mockConfirm;
		const result = confirmDialog("Are you sure?");
		expect(mockConfirm)
			.toHaveBeenCalledWith("Are you sure?");
		expect(result)
			.toBe(false);
	});
});

test("fancyBytes", () => {
	it("should convert bytes to KB, MB, GB, or TB", () => {
		expect(fancyBytes(1024))
			.toBe("1 KB");
		expect(fancyBytes(1024 * 1024))
			.toBe("1 MB");
		expect(fancyBytes(1024 * 1024 * 1024))
			.toBe("1 GB");
		expect(fancyBytes(1024 * 1024 * 1024 * 1024))
			.toBe("1 TB");
	});
});

test("generateHexColorFromString", () => {
	it("should generate a hex color code from a string", () => {
		expect(generateHexColorFromString("hello"))
			.toBe("#d9a7c7");
		expect(generateHexColorFromString("world"))
			.toBe("#a7c7d9");
		expect(generateHexColorFromString("foo"))
			.toBe("#c7d9a7");
		expect(generateHexColorFromString("bar"))
			.toBe("#d9c7a7");
	});
});

test("isRtcSupported", () => {
	it("should return true if RTC is supported", () => {
		expect(isRtcSupported())
			.toBe(true);
	});

	it("should return false if RTC is not supported", () => {
		const originalMediaDevices = navigator.mediaDevices;
		// @ts-ignore
		navigator.mediaDevices = undefined;
		expect(isRtcSupported())
			.toBe(false);
		// @ts-ignore
		navigator.mediaDevices = originalMediaDevices;
	});
});

test("randomName", () => {
	it("should generate a random name", () => {
		const name = randomName();
		expect(name)
			.toBeDefined();
		expect(name.length)
			.toBeGreaterThan(0);
	});
});
