/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
/* eslint-disable no-param-reassign */
import mongoose, { ConnectOptions } from 'mongoose';
import { Payload } from '../index';
import { connection } from './testCredentials';

const connectMongoose = async (
  payload: Payload,
  options: ConnectOptions,
): Promise<void> => {
  let urlToConnect: Payload['mongoURL'] = payload.mongoURL;
  if (urlToConnect === false) {
    return;
  }
  let successfulConnectionMessage = 'Connected to Mongo server successfully!';
  mongoose.set('strictQuery', false);
  const connectionOptions = {
    autoIndex: true,
    ...options,
    useNewUrlParser: true,
  };

  if (process.env.NODE_ENV === 'test') {
    connectionOptions.dbName = 'payloadmemory';
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const getPort = require('get-port');

    const port = await getPort();
    payload.mongoMemoryServer = await MongoMemoryServer.create({
      instance: {
        dbName: connection.name,
        port,
      },
    });

    urlToConnect = payload.mongoMemoryServer.getUri();
    successfulConnectionMessage = 'Connected to in-memory Mongo server successfully!';
  }

  try {
    const result = await mongoose.connect(urlToConnect as string, connectionOptions);
    payload.mongoConnection = result.connection;

    if (process.env.PAYLOAD_DROP_DATABASE === 'true') {
      payload.logger.info('---- DROPPING DATABASE ----');
      await mongoose.connection.dropDatabase();
      payload.logger.info('---- DROPPED DATABASE ----');
    }

    payload.logger.info(successfulConnectionMessage);
  } catch (err) {
    payload.logger.error(`Error: cannot connect to MongoDB. Details: ${err.message}`, err);
    process.exit(1);
  }
};

export default connectMongoose;
