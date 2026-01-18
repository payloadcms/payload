import { sql } from 'drizzle-orm';
export const execute = function execute({ db, drizzle, raw, sql: statement }) {
    const executeFrom = db ?? drizzle;
    if (raw) {
        const result = executeFrom.run(sql.raw(raw));
        return result;
    } else {
        const result = executeFrom.run(statement);
        return result;
    }
};

//# sourceMappingURL=execute.js.map