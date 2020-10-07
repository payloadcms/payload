const fs = require('fs');
const probeImageSize = require('probe-image-size');

const getImageSize = async (path) => {
  const image = fs.createReadStream(path);
  return probeImageSize(image);
};

module.exports = getImageSize;
