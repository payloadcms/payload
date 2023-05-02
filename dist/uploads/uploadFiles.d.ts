import type { TFunction } from 'i18next';
import { FileToSave } from './types';
import { Payload } from '../payload';
export declare const uploadFiles: (payload: Payload, files: FileToSave[], t: TFunction) => Promise<void>;
