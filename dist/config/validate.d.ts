import { Logger } from 'pino';
import { SanitizedConfig } from './types';
declare const validateSchema: (config: SanitizedConfig, logger: Logger) => Promise<SanitizedConfig>;
export default validateSchema;
