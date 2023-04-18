import { Collection } from '../../../collections/config/types';
declare function initResolver(collection: Collection): (_: any, args: any, context: any) => Promise<boolean>;
export default initResolver;
