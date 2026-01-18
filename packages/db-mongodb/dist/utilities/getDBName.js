import { APIError } from 'payload';
/**
 * Used to name database enums and collections
 * Returns the collection or enum name for a given entity
 */ export const getDBName = ({ config: { name, slug }, config, target = 'dbName', versions = false })=>{
    let result = null;
    let custom = config[target];
    if (!custom && target === 'enumName') {
        custom = config['dbName'];
    }
    if (custom) {
        result = typeof custom === 'function' ? custom({}) : custom;
    } else {
        result = name ?? slug ?? null;
    }
    if (versions) {
        result = `_${result}_versions`;
    }
    if (!result) {
        throw new APIError(`Assertion for DB name of ${name} ${slug} was failed.`);
    }
    return result;
};

//# sourceMappingURL=getDBName.js.map