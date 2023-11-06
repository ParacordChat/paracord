const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const encodeBytes = (txt: string | undefined) => encoder.encode(txt);

export const decodeBytes = (txt: any | undefined) => decoder.decode(txt);
