import type { Sharp, Metadata as SharpMetadata } from 'sharp';
import type { PayloadRequest } from '../types/index.js';
export type WithMetadata = ((options: {
    metadata: SharpMetadata;
    req: PayloadRequest;
}) => Promise<boolean>) | boolean;
export declare function optionallyAppendMetadata({ req, sharpFile, withMetadata, }: {
    req: PayloadRequest;
    sharpFile: Sharp;
    withMetadata: WithMetadata;
}): Promise<Sharp>;
//# sourceMappingURL=optionallyAppendMetadata.d.ts.map