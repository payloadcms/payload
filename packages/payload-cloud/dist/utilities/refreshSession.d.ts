import { S3 } from '@aws-sdk/client-s3';
export type GetStorageClient = () => Promise<{
    identityID: string;
    storageClient: S3;
}>;
export declare const refreshSession: () => Promise<{
    identityID: any;
    session: import("amazon-cognito-identity-js").CognitoUserSession;
    storageClient: S3;
}>;
//# sourceMappingURL=refreshSession.d.ts.map