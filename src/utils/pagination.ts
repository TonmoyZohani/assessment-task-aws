export function decodeNextToken(token?: string) {
  if (!token) return undefined;
  try {
    return JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
  } catch {
    return undefined;
  }
}

export function encodeNextToken(key?: Record<string, any> | undefined) {
  if (!key) return null;
  return Buffer.from(JSON.stringify(key)).toString("base64");
}
