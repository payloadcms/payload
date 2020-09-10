/* eslint-disable no-console */
const mongoose = require('mongoose');
const logger = require('../utilities/logger')();

const connectMongoose = async (url) => {
  let urlToConnect = url;
  let successfulConnectionMessage = 'Connected to Mongo server successfully!';

  if (process.env.NODE_ENV === 'test') {
    // eslint-disable-next-line global-require
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = new MongoMemoryServer();
    urlToConnect = await mongod.getUri();
    successfulConnectionMessage = 'Connected to in-memory Mongo server successfully!';
  }

  try {
    await mongoose.connect(urlToConnect, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      autoIndex: false,
    });
    logger.info(successfulConnectionMessage);
  } catch (err) {
    logger.error('Error: cannot connect to MongoDB. Details: ', err);
    process.exit(1);
  }
};

module.exports = connectMongoose;
