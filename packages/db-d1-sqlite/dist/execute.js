import { sql } from 'drizzle-orm';
export const execute = function execute({ db, drizzle, raw, sql: statement }) {
    const executeFrom = db ?? drizzle;
    const mapToLibSql = (query)=>{
        const execute = query.execute;
        query.execute = async ()=>{
            const result = await execute();
            const resultLibSQL = {
                columns: undefined,
                columnTypes: undefined,
                lastInsertRowid: BigInt(result.meta.last_row_id),
                rows: result.results,
                rowsAffected: result.meta.rows_written
            };
            return Object.assign(result, resultLibSQL);
        };
        return query;
    };
    if (raw) {
        const result = mapToLibSql(executeFrom.run(sql.raw(raw)));
        return result;
    } else {
        const result = mapToLibSql(executeFrom.run(statement));
        return result;
    }
};

//# sourceMappingURL=execute.js.map