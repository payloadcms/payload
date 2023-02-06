import fs from 'fs';
import probeImageSize from 'probe-image-size';
import { UploadedFile } from 'express-fileupload';
import { ProbedImageSize } from './types';

export default async function (file: UploadedFile): Promise<ProbedImageSize> {
  return file.tempFilePath
    ? probeImageSize(fs.createReadStream(file.tempFilePath))
    : probeImageSize.sync(file.data);
}
