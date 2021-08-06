import { UploadedFile } from 'express-fileupload';
import probeImageSize from 'probe-image-size';

export type ProbedImageSize = {
  width: number,
  height: number,
  type: string,
  mime: string,
}

export default async function (image: UploadedFile): Promise<ProbedImageSize> {
  return probeImageSize.sync(image.data);
}
