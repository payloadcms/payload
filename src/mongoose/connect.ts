/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
import mongoose, { ConnectOptions } from 'mongoose';
import pino from 'pino';
import { InitOptions } from '../config/types';
import { connection } from './testCredentials';

const connect = async (
  urlToConnectTo: string|false,
  options: InitOptions['mongoOptions'],
  logger: pino.Logger,
): Promise<void> => {
  await _connect(logger, urlToConnectTo, options);
  logger.info('Connected to Mongo server successfully!');
};

const connectInMemory = async (
  options: InitOptions['mongoOptions'],
  logger: pino.Logger,
): Promise<any> => {
  const getPort = require('get-port');
  const port = await getPort();

  const { MongoMemoryServer } = require('mongodb-memory-server');
  const mongoMemoryServer = await MongoMemoryServer.create({
    instance: {
      dbName: connection.name,
      port,
    },
  });

  await _connect(
    logger,
    mongoMemoryServer.getUri(),
    {
      ...options,
      dbName: 'payloadmemory',
    },
  );
  logger.info('Connected to in-memory Mongo server successfully!');

  return mongoMemoryServer;
};

const _connect = async (logger: pino.Logger, urlToConnectTo: string|false, options: InitOptions['mongoOptions']): Promise<void> => {
  if (!urlToConnectTo) {
    throw new Error('Error: missing MongoDB connection URL.');
  }
  const connectionOptions: ConnectOptions & { useFacet: undefined } = {
    autoIndex: true,
    ...options,
    useFacet: undefined,
  };
  mongoose.set('strictQuery', false);

  try {
    await mongoose.connect(urlToConnectTo, connectionOptions);

    if (process.env.PAYLOAD_DROP_DATABASE === 'true') {
      logger.info('---- DROPPING DATABASE ----');
      await mongoose.connection.dropDatabase();
      logger.info('---- DROPPED DATABASE ----');
    }
  } catch (err) {
    logger.error(`Error: cannot connect to MongoDB. Details: ${err.message}`, err);
    process.exit(1);
  }
};

export default { connect, connectInMemory };
