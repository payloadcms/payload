import { Request } from 'express';
import { SanitizedConfig } from '../config/types';
declare const getExtractJWT: (config: SanitizedConfig) => (req: Request) => string | null;
export default getExtractJWT;
