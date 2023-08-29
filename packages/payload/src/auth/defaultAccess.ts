import { PayloadRequest } from '../express/types.js';

export default ({ req: { user } }: { req: PayloadRequest }): boolean => Boolean(user);
