import { UploadedFile } from 'express-fileupload';
import { ProbedImageSize } from './types';
export default function (file: UploadedFile): Promise<ProbedImageSize>;
