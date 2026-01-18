export const dropDatabase = async function dropDatabase({ adapter }) {
    await adapter.execute({
        drizzle: adapter.drizzle,
        raw: `drop schema if exists ${this.schemaName || 'public'} cascade;
    create schema ${this.schemaName || 'public'};`
    });
};

//# sourceMappingURL=dropDatabase.js.map