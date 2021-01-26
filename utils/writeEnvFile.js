const fs = require('fs-extra');
const { getDatabaseConnection } = require('./getDatabaseConnection');
const { getPayloadSecret } = require('./getPayloadSecret');
const { getProjectDir } = require('./getProjectDir');
const { error, success } = require('./log');

const writeEnvFile = async () => {

  const mongoURI = await getDatabaseConnection();
  const payloadSecret = await getPayloadSecret();

  let content = `MONGODB_URI=${mongoURI}\nPAYLOAD_SECRET=${payloadSecret}`;

  try {
    await fs.outputFile(`${await getProjectDir()}/.env`, content);
    success('.env file created');
  } catch (err) {
    error('Unable to write .env file');
    error(err);
    process.exit(1);
  }
  return;
};

module.exports = { writeEnvFile };