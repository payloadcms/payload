"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
const mongoose_1 = __importDefault(require("mongoose"));
const testCredentials_1 = require("./testCredentials");
const connectMongoose = async (url, options, logger) => {
    let urlToConnect = url;
    let successfulConnectionMessage = 'Connected to Mongo server successfully!';
    const connectionOptions = {
        autoIndex: true,
        ...options,
        useFacet: undefined,
    };
    let mongoMemoryServer;
    if (process.env.NODE_ENV === 'test') {
        connectionOptions.dbName = 'payloadmemory';
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const getPort = require('get-port');
        const port = await getPort();
        mongoMemoryServer = await MongoMemoryServer.create({
            instance: {
                dbName: testCredentials_1.connection.name,
                port,
            },
        });
        urlToConnect = mongoMemoryServer.getUri();
        successfulConnectionMessage = 'Connected to in-memory Mongo server successfully!';
    }
    try {
        await mongoose_1.default.connect(urlToConnect, connectionOptions);
        if (process.env.PAYLOAD_DROP_DATABASE === 'true') {
            logger.info('---- DROPPING DATABASE ----');
            await mongoose_1.default.connection.dropDatabase();
            logger.info('---- DROPPED DATABASE ----');
        }
        logger.info(successfulConnectionMessage);
    }
    catch (err) {
        logger.error(`Error: cannot connect to MongoDB. Details: ${err.message}`, err);
        process.exit(1);
    }
    return mongoMemoryServer;
};
exports.default = connectMongoose;
//# sourceMappingURL=connect.js.map