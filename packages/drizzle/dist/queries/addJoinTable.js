import { getNameFromDrizzleTable } from '../utilities/getNameFromDrizzleTable.js';
export const addJoinTable = ({ type, condition, joins, queryPath, table })=>{
    const name = getNameFromDrizzleTable(table);
    if (!joins.some((eachJoin)=>getNameFromDrizzleTable(eachJoin.table) === name)) {
        joins.push({
            type,
            condition,
            queryPath,
            table
        });
    }
};

//# sourceMappingURL=addJoinTable.js.map