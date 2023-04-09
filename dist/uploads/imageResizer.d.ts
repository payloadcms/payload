import { UploadedFile } from 'express-fileupload';
import { SanitizedCollectionConfig } from '../collections/config/types';
import { PayloadRequest } from '../express/types';
import { FileSizes, FileToSave } from './types';
type Dimensions = {
    width?: number;
    height?: number;
};
type Args = {
    req: PayloadRequest;
    file: UploadedFile;
    dimensions: Dimensions;
    staticPath: string;
    config: SanitizedCollectionConfig;
    savedFilename: string;
    mimeType: string;
};
type Result = Promise<{
    sizeData: FileSizes;
    sizesToSave: FileToSave[];
}>;
export default function resizeAndSave({ req, file, dimensions, staticPath, config, savedFilename, }: Args): Promise<Result>;
export {};
