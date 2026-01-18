const setConnectionStringDatabase = ({ connectionString, database })=>{
    const connectionURL = new URL(connectionString);
    const newConnectionURL = new URL(connectionURL);
    newConnectionURL.pathname = `/${database}`;
    return newConnectionURL.toString();
};
export const createDatabase = async function(args = {}) {
    // POSTGRES_URL - default Vercel env
    const connectionString = this.poolOptions?.connectionString ?? process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
    let managementClientConfig = {};
    let dbName = args.name;
    const schemaName = this.schemaName || 'public';
    if (connectionString) {
        if (!dbName) {
            dbName = new URL(connectionString).pathname.slice(1);
        }
        managementClientConfig.connectionString = setConnectionStringDatabase({
            connectionString,
            database: 'postgres'
        });
    } else {
        if (!dbName) {
            dbName = this.poolOptions.database;
        }
        managementClientConfig = {
            ...this.poolOptions,
            database: 'postgres'
        };
    }
    // import pg only when createDatabase is used
    const pg = await import('pg').then((mod)=>mod.default);
    const managementClient = new pg.Client(managementClientConfig);
    try {
        await managementClient.connect();
        await managementClient.query(`CREATE DATABASE "${dbName}"`);
        this.payload.logger.info(`Created database "${dbName}"`);
        if (schemaName !== 'public') {
            let createdDatabaseConfig = {};
            if (connectionString) {
                createdDatabaseConfig.connectionString = setConnectionStringDatabase({
                    connectionString,
                    database: dbName
                });
            } else {
                createdDatabaseConfig = {
                    ...this.poolOptions,
                    database: dbName
                };
            }
            const createdDatabaseClient = new pg.Client(createdDatabaseConfig);
            try {
                await createdDatabaseClient.connect();
                await createdDatabaseClient.query(`CREATE SCHEMA ${schemaName}`);
                this.payload.logger.info(`Created schema "${dbName}.${schemaName}"`);
            } catch (err) {
                this.payload.logger.error({
                    err,
                    msg: `Error: failed to create schema "${dbName}.${schemaName}". Details: ${err.message}`
                });
            } finally{
                await createdDatabaseClient.end();
            }
        }
        return true;
    } catch (err) {
        this.payload.logger.error({
            err,
            msg: `Error: failed to create database ${dbName}. Details: ${err.message}`
        });
        return false;
    } finally{
        await managementClient.end();
    }
};

//# sourceMappingURL=createDatabase.js.map