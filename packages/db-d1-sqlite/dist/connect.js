import { pushDevSchema } from '@payloadcms/drizzle';
import { drizzle } from 'drizzle-orm/d1';
export const connect = async function connect(options = {
    hotReload: false
}) {
    const { hotReload } = options;
    this.schema = {
        ...this.tables,
        ...this.relations
    };
    try {
        const logger = this.logger || false;
        const readReplicas = this.readReplicas;
        let binding = this.binding;
        if (readReplicas && readReplicas === 'first-primary') {
            // @ts-expect-error - need to have types that support withSession binding from D1
            binding = this.binding.withSession('first-primary');
        }
        this.drizzle = drizzle(binding, {
            logger,
            schema: this.schema
        });
        this.client = this.drizzle.$client;
        if (!hotReload) {
            if (process.env.PAYLOAD_DROP_DATABASE === 'true') {
                this.payload.logger.info(`---- DROPPING TABLES ----`);
                await this.dropDatabase({
                    adapter: this
                });
                this.payload.logger.info('---- DROPPED TABLES ----');
            }
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.payload.logger.error({
            err,
            msg: `Error: cannot connect to SQLite: ${message}`
        });
        if (typeof this.rejectInitializing === 'function') {
            this.rejectInitializing();
        }
        console.error(err);
        throw new Error(`Error: cannot connect to SQLite: ${message}`);
    }
    // Only push schema if not in production
    if (process.env.NODE_ENV !== 'production' && process.env.PAYLOAD_MIGRATING !== 'true' && this.push !== false) {
        await pushDevSchema(this);
    }
    if (typeof this.resolveInitializing === 'function') {
        this.resolveInitializing();
    }
    if (process.env.NODE_ENV === 'production' && this.prodMigrations) {
        await this.migrate({
            migrations: this.prodMigrations
        });
    }
};

//# sourceMappingURL=connect.js.map