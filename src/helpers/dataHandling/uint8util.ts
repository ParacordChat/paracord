export const encodeBytes = (txt: string | undefined) =>
	new TextEncoder()
		.encode(txt);

export const decodeBytes = (txt: any | undefined) =>
	new TextDecoder()
		.decode(txt);

export const combineChunks = (chunks: any[]) => {
	const full = new Uint8Array(
		chunks.reduce((a: any, c: { byteLength: any }) => a + c.byteLength, 0)
	);

	for (let i = 0, l = chunks.length, c = 0; i < l; i++) {
		full.set(chunks[i], c);
		c += chunks[i].byteLength;
	}

	return full;
};