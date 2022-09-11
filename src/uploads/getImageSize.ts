import probeImageSize from 'probe-image-size';

export type ProbedImageSize = {
  width: number,
  height: number,
  type: string,
  mime: string,
}

export default async function (buffer: Buffer): Promise<ProbedImageSize> {
  return probeImageSize.sync(buffer);
}
