import { Config as SchemaConfig } from 'payload/generated-types';
import { PayloadRequest } from '../../../express/types';
import { Collection } from '../../config/types';
export type Resolver<T> = (_: unknown, args: {
    locale?: string;
    draft: boolean;
    id: string;
    fallbackLocale?: string;
}, context: {
    req: PayloadRequest;
    res: Response;
}) => Promise<T>;
export default function findByIDResolver<T extends keyof SchemaConfig['collections']>(collection: Collection): Resolver<SchemaConfig['collections'][T]>;
