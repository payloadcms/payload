import { Access, AccessResult } from '../config/types';
declare const executeAccess: (operation: any, access: Access) => Promise<AccessResult>;
export default executeAccess;
