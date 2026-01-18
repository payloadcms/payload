import { APIError } from 'payload';
import { v4 as uuid } from 'uuid';
// Needs await to fulfill the interface
// @ts-expect-error TransactionOptions isn't compatible with BeginTransaction of the DatabaseAdapter interface.
// eslint-disable-next-line @typescript-eslint/require-await
export const beginTransaction = async function beginTransaction(options) {
    if (!this.connection) {
        throw new APIError('beginTransaction called while no connection to the database exists');
    }
    const client = this.connection.getClient();
    const id = uuid();
    if (!this.sessions[id]) {
        // @ts-expect-error BaseDatabaseAdapter and MongoosAdapter (that extends Base) sessions aren't compatible.
        this.sessions[id] = client.startSession();
    }
    if (this.sessions[id]?.inTransaction()) {
        this.payload.logger.warn('beginTransaction called while transaction already exists');
    } else {
        this.sessions[id]?.startTransaction(options || this.transactionOptions);
    }
    return id;
};

//# sourceMappingURL=beginTransaction.js.map