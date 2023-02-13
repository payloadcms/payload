/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
import mongoose, { ConnectOptions } from "mongoose";
import { Payload } from "../payload";
import { connection } from "./testCredentials";

const connectMongoose = async (
  payload: Payload,
  options: ConnectOptions
): Promise<void> => {
  if (payload.mongoURL === false) return;
  let urlToConnect = payload.mongoURL;

  let successfulConnectionMessage = "Connected to Mongo server successfully!";
  mongoose.set("strictQuery", false);
  const connectionOptions = {
    autoIndex: true,
    ...options,
    useNewUrlParser: true,
  };

  if (process.env.NODE_ENV === "test") {
    connectionOptions.dbName = "payloadmemory";
    const { MongoMemoryServer } = require("mongodb-memory-server");
    const getPort = require("get-port");

    const port = await getPort();
    payload.mongoMemoryServer = await MongoMemoryServer.create({
      instance: {
        dbName: connection.name,
        port,
      },
    });

    urlToConnect = payload.mongoMemoryServer.getUri();
    successfulConnectionMessage =
      "Connected to in-memory Mongo server successfully!";
  }

  try {
    payload.mongooseConnection = (
      await mongoose.connect(urlToConnect, connectionOptions)
    )?.connection;

    if (process.env.PAYLOAD_DROP_DATABASE === "true") {
      payload.logger.info("---- DROPPING DATABASE ----");
      await mongoose.connection.dropDatabase();
      payload.logger.info("---- DROPPED DATABASE ----");
    }

    payload.logger.info(successfulConnectionMessage);
  } catch (err) {
    payload.logger.error(
      `Error: cannot connect to MongoDB. Details: ${err.message}`,
      err
    );
    process.exit(1);
  }
};

export default connectMongoose;
