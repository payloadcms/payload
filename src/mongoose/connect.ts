import mongoose, { ConnectOptions } from 'mongoose';
import pino from 'pino';
import { connection } from './testCredentials';

const connectMongoose = async (
  url: string,
  options: ConnectOptions,
  local: boolean,
  logger: pino.Logger,
): Promise<void> => {
  let urlToConnect = url;
  let successfulConnectionMessage = 'Connected to Mongo server successfully!';
  const connectionOptions = {
    ...options,
    useNewUrlParser: true,
    autoIndex: true,
  };

  if (process.env.NODE_ENV === 'test' || process.env.MEMORY_SERVER) {
    if (local) {
      urlToConnect = `${connection.url}:${connection.port}/${connection.name}`;
    } else {
      connectionOptions.dbName = 'payloadmemory';
      // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongo = await MongoMemoryServer.create({
        instance: {
          dbName: connection.name,
          port: connection.port,
        },
      });

      urlToConnect = mongo.getUri();
      successfulConnectionMessage = 'Connected to in-memory Mongo server successfully!';
    }
  }


  try {
    await mongoose.connect(urlToConnect, connectionOptions);
    logger.info(successfulConnectionMessage);
  } catch (err) {
    logger.error(`Error: cannot connect to MongoDB. Details: ${err.message}`, err);
    process.exit(1);
  }
};

export default connectMongoose;
