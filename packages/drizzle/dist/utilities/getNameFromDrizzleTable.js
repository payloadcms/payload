import { getTableName } from 'drizzle-orm';
export const getNameFromDrizzleTable = (table)=>{
    return getTableName(table);
};

//# sourceMappingURL=getNameFromDrizzleTable.js.map