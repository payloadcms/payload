import pino from 'pino';
import Logger from '../utilities/logger';
import { SanitizedConfig } from './types';
declare const loadConfig: (logger?: pino.Logger) => Promise<SanitizedConfig>;
export default loadConfig;
