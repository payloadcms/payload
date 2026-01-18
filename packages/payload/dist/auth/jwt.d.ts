export declare const jwtSign: ({ fieldsToSign, secret, tokenExpiration, }: {
    fieldsToSign: Record<string, unknown>;
    secret: string;
    tokenExpiration: number;
}) => Promise<{
    exp: number;
    token: string;
}>;
//# sourceMappingURL=jwt.d.ts.map