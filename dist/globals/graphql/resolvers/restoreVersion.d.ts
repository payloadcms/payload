import { SanitizedGlobalConfig } from '../../config/types';
import { Document } from '../../../types';
import { PayloadRequest } from '../../../express/types';
type Resolver = (_: unknown, args: {
    id: string | number;
}, context: {
    req: PayloadRequest;
    res: Response;
}) => Promise<Document>;
export default function restoreVersionResolver(globalConfig: SanitizedGlobalConfig): Resolver;
export {};
