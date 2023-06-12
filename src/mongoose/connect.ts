/* eslint-disable @typescript-eslint/no-var-requires */
import type { ConnectOptions } from 'mongoose';
import mongoose from 'mongoose';
import type { Payload } from '..';

import type { MongooseAdapter } from '.';

export async function connect(
  this: MongooseAdapter,
  { payload }: { payload: Payload },
): Promise<void> {
  let urlToConnect = this.url;
  let successfulConnectionMessage = 'Connected to MongoDB server successfully!';

  const connectionOptions: ConnectOptions & { useFacet: undefined } = {
    autoIndex: true,
    ...this.connectOptions,
    useFacet: undefined,
  };

  let mongoMemoryServer;

  if (process.env.NODE_ENV === 'test') {
    if (process.env.PAYLOAD_TEST_MONGO_URL) {
      urlToConnect = process.env.PAYLOAD_TEST_MONGO_URL;
    } else {
      connectionOptions.dbName = 'payloadmemory';
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const getPort = require('get-port');

      const port = await getPort();
      mongoMemoryServer = await MongoMemoryServer.create({
        instance: {
          dbName: 'payloadmemory',
          port,
        },
      });

      urlToConnect = mongoMemoryServer.getUri();
      successfulConnectionMessage = 'Connected to in-memory MongoDB server successfully!';
    }
  }

  try {
    await mongoose.connect(urlToConnect, connectionOptions);

    if (process.env.PAYLOAD_DROP_DATABASE === 'true') {
      payload.logger.info('---- DROPPING DATABASE ----');
      await mongoose.connection.dropDatabase();
      payload.logger.info('---- DROPPED DATABASE ----');
    }
    payload.logger.info(successfulConnectionMessage);
  } catch (err) {
    payload.logger.error(
      `Error: cannot connect to MongoDB. Details: ${err.message}`,
      err,
    );
    process.exit(1);
  }

  this.mongoMemoryServer = mongoMemoryServer;

  return mongoMemoryServer;
}
