const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

const base64CharToIndex = new Uint8Array(256).fill(255);
for (let i = 0; i < BASE64_CHARS.length; i++) {
  base64CharToIndex[BASE64_CHARS.charCodeAt(i)] = i;
}

export const base64ToBytes = (value: string): Uint8Array => {
  if (!value) return new Uint8Array();
  const clean = value.replace(/[^A-Za-z0-9+/=]/g, '');
  const length = clean.length;
  if (!length) return new Uint8Array();
  const placeholders = clean[length - 2] === '=' ? 2 : clean[length - 1] === '=' ? 1 : 0;
  const output = new Uint8Array((length * 3) / 4 - placeholders);
  let p = 0;

  for (let i = 0; i < length; i += 4) {
    const e1 = base64CharToIndex[clean.charCodeAt(i)];
    const e2 = base64CharToIndex[clean.charCodeAt(i + 1)];
    const e3 = base64CharToIndex[clean.charCodeAt(i + 2)];
    const e4 = base64CharToIndex[clean.charCodeAt(i + 3)];

    const chunk = (e1 << 18) | (e2 << 12) | ((e3 & 63) << 6) | (e4 & 63);
    if (p < output.length) output[p++] = (chunk >> 16) & 255;
    if (p < output.length) output[p++] = (chunk >> 8) & 255;
    if (p < output.length) output[p++] = chunk & 255;
  }

  return output;
};

export const bytesToBase64 = (bytes: Uint8Array): string => {
  if (!bytes?.length) return '';
  let output = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const chunk = ((bytes[i] ?? 0) << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    output += BASE64_CHARS[(chunk >> 18) & 63];
    output += BASE64_CHARS[(chunk >> 12) & 63];
    output += i + 1 < bytes.length ? BASE64_CHARS[(chunk >> 6) & 63] : '=';
    output += i + 2 < bytes.length ? BASE64_CHARS[chunk & 63] : '=';
  }
  return output;
};
