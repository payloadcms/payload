import type * as AWS from '@aws-sdk/client-s3';
import type { CognitoUserSession } from 'amazon-cognito-identity-js';
import type { GetStorageClient } from './refreshSession.js';
export declare let storageClient: AWS.S3 | null;
export declare let session: CognitoUserSession | null;
export declare let identityID: string;
export declare const getStorageClient: GetStorageClient;
//# sourceMappingURL=getStorageClient.d.ts.map