import fs from 'fs';
import probeImageSize from 'probe-image-size';

type ProbedImageSize = {
  width: number,
  height: number,
  type: string,
  mime: string,
}

export default async function (path: string): Promise<ProbedImageSize> {
  const image = fs.createReadStream(path);
  return probeImageSize(image);
}
