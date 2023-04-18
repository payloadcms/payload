import { Schema } from 'mongoose';
import { SanitizedConfig } from '../config/types';
import { SanitizedCollectionConfig } from './config/types';
declare const buildCollectionSchema: (collection: SanitizedCollectionConfig, config: SanitizedConfig, schemaOptions?: {}) => Schema;
export default buildCollectionSchema;
