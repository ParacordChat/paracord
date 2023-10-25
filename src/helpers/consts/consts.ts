export const chunkSize = 128 * 2 ** 10;
export const oneByteMax = 0xFF;

export const libName = "distra";

export const events = Object.fromEntries(
	["close", "connect", "data", "error", "signal", "stream", "track"].map(
		(k) => [k, k]
	)
);
