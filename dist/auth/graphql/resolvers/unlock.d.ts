import { Collection } from '../../../collections/config/types';
declare function unlockResolver(collection: Collection): (_: any, args: any, context: any) => Promise<boolean>;
export default unlockResolver;
