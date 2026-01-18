export const deleteWhere = async function deleteWhere({ db, tableName, where }) {
    const table = this.tables[tableName];
    await db.delete(table).where(where);
};

//# sourceMappingURL=deleteWhere.js.map