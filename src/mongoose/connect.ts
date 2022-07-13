import mongoose, { ConnectOptions } from 'mongoose';
import pino from 'pino';
import getPort from 'get-port';
import { connection } from './testCredentials';

const connectMongoose = async (
  url: string,
  options: ConnectOptions,
  logger: pino.Logger,
): Promise<void | any> => {
  let urlToConnect = url;
  let successfulConnectionMessage = 'Connected to Mongo server successfully!';
  const connectionOptions = {
    autoIndex: true,
    ...options,
    useNewUrlParser: true,
  };

  let mongoMemoryServer;

  if (process.env.NODE_ENV === 'test') {
    connectionOptions.dbName = 'payloadmemory';
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const port = await getPort();
    mongoMemoryServer = await MongoMemoryServer.create({
      instance: {
        dbName: connection.name,
        port,
      },
    });

    urlToConnect = mongoMemoryServer.getUri();
    successfulConnectionMessage = 'Connected to in-memory Mongo server successfully!';
  }

  try {
    await mongoose.connect(urlToConnect, connectionOptions);

    if (process.env.PAYLOAD_DROP_DATABASE === 'true') {
      logger.info('---- DROPPING DATABASE ----');
      await mongoose.connection.dropDatabase();
      logger.info('---- DROPPED DATABASE ----');
    }

    logger.info(successfulConnectionMessage);
  } catch (err) {
    logger.error(`Error: cannot connect to MongoDB. Details: ${err.message}`, err);
    process.exit(1);
  }

  return mongoMemoryServer;
};

export default connectMongoose;
