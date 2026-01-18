import { nodemailerAdapter } from '@payloadcms/email-nodemailer';
import type { PayloadCloudEmailOptions } from './types.js';
type NodemailerAdapter = ReturnType<typeof nodemailerAdapter>;
export declare const payloadCloudEmail: (args: PayloadCloudEmailOptions) => Promise<NodemailerAdapter | undefined>;
export {};
//# sourceMappingURL=email.d.ts.map