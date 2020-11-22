import crypto from 'crypto';

const algorithm = 'aes-256-ctr';

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, this.secret, iv);

  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

  const ivString = iv.toString('hex');
  const encryptedString = encrypted.toString('hex');

  const result = `${ivString}${encryptedString}`;
  return result;
}

export function decrypt(hash: string): string {
  const iv = hash.slice(0, 32);
  const content = hash.slice(32);

  const decipher = crypto.createDecipheriv(algorithm, this.secret, Buffer.from(iv, 'hex'));

  const decrypted = Buffer.concat([decipher.update(Buffer.from(content, 'hex')), decipher.final()]);

  const result = decrypted.toString();
  return result;
}
