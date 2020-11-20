import fs from 'fs';
import probeImageSize from 'probe-image-size';

const getImageSize = async (path) => {
  const image = fs.createReadStream(path);
  return probeImageSize(image);
};

export default getImageSize;
