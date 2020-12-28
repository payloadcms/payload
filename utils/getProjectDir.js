const slugify = require('@sindresorhus/slugify');
const { getProjectName } = require('./getProjectName');

const getProjectDir = async () => `./${slugify(await getProjectName())}`;

module.exports = {
  getProjectDir,
}