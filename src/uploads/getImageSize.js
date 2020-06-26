const imageSize = require('image-size');
const { promisify } = require('util');

const getImageSize = promisify(imageSize);

module.exports = getImageSize;
