const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const encodeBytes = (txt: string | undefined) => encoder.encode(txt);

export const decodeBytes = (txt: any | undefined) => decoder.decode(txt);

export const combineChunks = (chunks: Uint8Array[]) => {
	const full = new Uint8Array(chunks.reduce((a, c) => a + c.byteLength, 0));

	let offset = 0;
	for (const chunk of chunks) {
		full.set(chunk, offset);
		offset += chunk.byteLength;
	}

	return full;
};
