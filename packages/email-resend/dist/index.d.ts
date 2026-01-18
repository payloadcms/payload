import type { EmailAdapter } from 'payload';
export type ResendAdapterArgs = {
    apiKey: string;
    defaultFromAddress: string;
    defaultFromName: string;
};
type ResendAdapter = EmailAdapter<ResendResponse>;
type ResendError = {
    message: string;
    name: string;
    statusCode: number;
};
type ResendResponse = {
    id: string;
} | ResendError;
/**
 * Email adapter for [Resend](https://resend.com) REST API
 */
export declare const resendAdapter: (args: ResendAdapterArgs) => ResendAdapter;
export type Tag = {
    /**
     * The name of the email tag. It can only contain ASCII letters (a–z, A–Z), numbers (0–9), underscores (_), or dashes (-). It can contain no more than 256 characters.
     */
    name: string;
    /**
     * The value of the email tag. It can only contain ASCII letters (a–z, A–Z), numbers (0–9), underscores (_), or dashes (-). It can contain no more than 256 characters.
     */
    value: string;
};
export {};
//# sourceMappingURL=index.d.ts.map