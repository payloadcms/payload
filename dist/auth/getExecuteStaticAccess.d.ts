import { Response, NextFunction } from 'express';
import { PayloadRequest } from '../express/types';
declare const getExecuteStaticAccess: ({ config, Model }: {
    config: any;
    Model: any;
}) => (req: PayloadRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export default getExecuteStaticAccess;
