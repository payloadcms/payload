import { sql } from 'drizzle-orm';
export const execute = function execute({ db, drizzle, raw, sql: statement }) {
    const executeFrom = db ?? drizzle;
    if (raw) {
        return executeFrom.execute(sql.raw(raw));
    } else {
        return executeFrom.execute(sql`${statement}`);
    }
};

//# sourceMappingURL=execute.js.map