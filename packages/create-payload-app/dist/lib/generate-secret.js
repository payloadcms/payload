import { randomBytes } from 'crypto';
export function generateSecret() {
    return randomBytes(32).toString('hex').slice(0, 24);
}

//# sourceMappingURL=generate-secret.js.map