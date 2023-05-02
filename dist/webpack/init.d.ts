import { Router } from 'express';
import { SanitizedConfig } from '../config/types';
declare function initWebpack(config: SanitizedConfig): Router;
export default initWebpack;
