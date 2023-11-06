export const events = {
	close: "close",
	connect: "connect",
	data: "data",
	error: "error",
	signal: "signal",
	stream: "stream",
	track: "track"
};

export const chunkSize = 128 * 2 ** 10; // 128KB
export const oneByteMax = 0xFF;

export const libName = "distra";
