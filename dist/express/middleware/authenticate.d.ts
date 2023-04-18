import { Request, Response, NextFunction } from 'express';
import { SanitizedConfig } from '../../config/types';
export type PayloadAuthenticate = (req: Request, res: Response, next: NextFunction) => NextFunction;
declare const _default: (config: SanitizedConfig) => PayloadAuthenticate;
export default _default;
