const base64abc = [
	..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
];

const base64codes = Array.from({ length: 256 }, () => 255);
base64abc.forEach((char, index) => {
	base64codes[char.codePointAt(0)!] = index;
});
base64codes["=".codePointAt(0)!] = 0;

function getBase64Code(charCode: number) {
	if (charCode >= base64codes.length) {
		throw new Error("Unable to parse base64 string.");
	}
	const code = base64codes[charCode];
	if (code === 255) {
		throw new Error("Unable to parse base64 string.");
	}
	return code;
}

export function bytesToBase64(bytes: Uint8Array) {
	let result = "";
	let i;
	const l = bytes.length;
	for (i = 2; i < l; i += 3) {
		result += base64abc[bytes[i - 2] >> 2];
		result += base64abc[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
		result += base64abc[((bytes[i - 1] & 0x0F) << 2) | (bytes[i] >> 6)];
		result += base64abc[bytes[i] & 0x3F];
	}
	if (i === l + 1) {
		// 1 octet yet to write
		result += base64abc[bytes[i - 2] >> 2];
		result += base64abc[(bytes[i - 2] & 0x03) << 4];
		result += "==";
	}
	if (i === l) {
		// 2 octets yet to write
		result += base64abc[bytes[i - 2] >> 2];
		result += base64abc[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
		result += base64abc[(bytes[i - 1] & 0x0F) << 2];
		result += "=";
	}
	return result;
}

export function base64ToBytes(str: string) {
	if (str.length % 4 !== 0) {
		throw new Error("Unable to parse base64 string.");
	}
	const index = str.indexOf("=");
	if (index !== -1 && index < str.length - 2) {
		throw new Error("Unable to parse base64 string.");
	}
	const missingOctets = str.endsWith("==") ? 2 : (str.endsWith("=") ? 1 : 0);
	const n = str.length;
	const result = new Uint8Array(3 * (n / 4));
	let buffer;
	for (let i = 0, j = 0; i < n; i += 4, j += 3) {
		buffer =
			(getBase64Code(str.codePointAt(i)!) << 18) |
			(getBase64Code(str.codePointAt(i + 1)!) << 12) |
			(getBase64Code(str.codePointAt(i + 2)!) << 6) |
			getBase64Code(str.codePointAt(i + 3)!);
		result[j] = buffer >> 16;
		result[j + 1] = (buffer >> 8) & 0xFF;
		result[j + 2] = buffer & 0xFF;
	}
	return result.subarray(0, result.length - missingOctets);
}
