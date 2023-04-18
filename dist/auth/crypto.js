"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decrypt = exports.encrypt = void 0;
const crypto_1 = __importDefault(require("crypto"));
const algorithm = 'aes-256-ctr';
function encrypt(text) {
    const iv = crypto_1.default.randomBytes(16);
    const cipher = crypto_1.default.createCipheriv(algorithm, this.secret, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    const ivString = iv.toString('hex');
    const encryptedString = encrypted.toString('hex');
    return `${ivString}${encryptedString}`;
}
exports.encrypt = encrypt;
function decrypt(hash) {
    const iv = hash.slice(0, 32);
    const content = hash.slice(32);
    const decipher = crypto_1.default.createDecipheriv(algorithm, this.secret, Buffer.from(iv, 'hex'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(content, 'hex')), decipher.final()]);
    return decrypted.toString();
}
exports.decrypt = decrypt;
//# sourceMappingURL=crypto.js.map