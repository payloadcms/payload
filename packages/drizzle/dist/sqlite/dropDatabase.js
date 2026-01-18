const getTables = (adapter)=>{
    return adapter.client.execute(`SELECT name
                                 FROM sqlite_master
                                 WHERE type = 'table'
                                   AND name NOT LIKE 'sqlite_%';`);
};
const dropTables = (adapter, rows)=>{
    const multi = `
  PRAGMA foreign_keys = OFF;\n
  ${rows.map(({ name })=>`DROP TABLE IF EXISTS ${name}`).join(';\n ')};\n
  PRAGMA foreign_keys = ON;`;
    return adapter.client.executeMultiple(multi);
};
export const dropDatabase = async function({ adapter }) {
    const result = await getTables(adapter);
    await dropTables(adapter, result.rows);
};

//# sourceMappingURL=dropDatabase.js.map