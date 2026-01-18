import type * as AWS from '@aws-sdk/client-s3';
import type { GenerateURL } from '@payloadcms/plugin-cloud-storage/types';
interface Args {
    bucket: string;
    config: AWS.S3ClientConfig;
}
export declare const getGenerateURL: ({ bucket, config: { endpoint } }: Args) => GenerateURL;
export {};
//# sourceMappingURL=generateURL.d.ts.map