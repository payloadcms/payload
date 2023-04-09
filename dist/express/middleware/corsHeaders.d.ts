import { Request, Response, NextFunction } from 'express';
import { SanitizedConfig } from '../../config/types';
declare const _default: (config: SanitizedConfig) => (req: Request, res: Response, next: NextFunction) => void;
export default _default;
