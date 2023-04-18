import { Config, SanitizedConfig } from './types';
/**
 * @description Builds and validates Payload configuration
 * @param config Payload Config
 * @returns Built and sanitized Payload Config
 */
export declare function buildConfig(config: Config): Promise<SanitizedConfig>;
