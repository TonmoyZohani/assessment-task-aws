"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeNextToken = decodeNextToken;
exports.encodeNextToken = encodeNextToken;
function decodeNextToken(token) {
    if (!token)
        return undefined;
    try {
        return JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
    }
    catch {
        return undefined;
    }
}
function encodeNextToken(key) {
    if (!key)
        return null;
    return Buffer.from(JSON.stringify(key)).toString("base64");
}
