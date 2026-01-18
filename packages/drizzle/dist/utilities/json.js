import { sql } from 'drizzle-orm';
export function jsonAgg(adapter, expression) {
    if (adapter.name === 'sqlite') {
        return sql`coalesce(json_group_array(${expression}), '[]')`;
    }
    return sql`coalesce(json_agg(${expression}), '[]'::json)`;
}
/**
 * @param shape Potential for SQL injections, so you shouldn't allow user-specified key names
 */ export function jsonBuildObject(adapter, shape) {
    const chunks = [];
    Object.entries(shape).forEach(([key, value])=>{
        if (chunks.length > 0) {
            chunks.push(sql.raw(','));
        }
        chunks.push(sql.raw(`'${key}',`));
        chunks.push(sql`${value}`);
    });
    if (adapter.name === 'sqlite') {
        return sql`json_object(${sql.join(chunks)})`;
    }
    return sql`json_build_object(${sql.join(chunks)})`;
}
export const jsonAggBuildObject = (adapter, shape)=>{
    return jsonAgg(adapter, jsonBuildObject(adapter, shape));
};

//# sourceMappingURL=json.js.map