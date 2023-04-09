import { SanitizedConfig } from '../config/types';
import { GlobalModel } from './config/types';
declare const buildModel: (config: SanitizedConfig) => GlobalModel | null;
export default buildModel;
