import { Collection } from '../../../collections/config/types';
declare function refreshResolver(collection: Collection): (_: any, args: any, context: any) => Promise<import("../../operations/refresh").Result>;
export default refreshResolver;
