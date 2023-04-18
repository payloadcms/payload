import { Config as GeneratedTypes } from 'payload/generated-types';
import { DeepPartial } from 'ts-essentials';
import { PayloadRequest } from '../../../express/types';
import { SanitizedGlobalConfig } from '../../config/types';
type Resolver<TSlug extends keyof GeneratedTypes['globals']> = (_: unknown, args: {
    locale?: string;
    fallbackLocale?: string;
    data?: DeepPartial<Omit<GeneratedTypes['globals'][TSlug], 'id'>>;
    draft?: boolean;
}, context: {
    req: PayloadRequest;
    res: Response;
}) => Promise<GeneratedTypes['globals'][TSlug]>;
export default function updateResolver<TSlug extends keyof GeneratedTypes['globals']>(globalConfig: SanitizedGlobalConfig): Resolver<TSlug>;
export {};
