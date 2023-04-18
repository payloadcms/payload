import pino from 'pino';
import { InitOptions } from '../config/types';
declare const connectMongoose: (url: string, options: InitOptions['mongoOptions'], logger: pino.Logger) => Promise<void | any>;
export default connectMongoose;
