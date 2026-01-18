export const insert = async function insert({ db, onConflictDoUpdate, tableName, values }) {
    const table = this.tables[tableName];
    let result;
    if (onConflictDoUpdate) {
        result = await db.insert(table).values(values).onConflictDoUpdate(onConflictDoUpdate).returning();
    } else {
        result = await db.insert(table).values(values).returning();
    }
    return result;
};

//# sourceMappingURL=insert.js.map