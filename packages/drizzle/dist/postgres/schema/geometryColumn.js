// Uses custom one instead of geometry() from drizzle-orm/pg-core because it's broken on pushDevSchema
// Why?
// It tries to give us a prompt "you're about to change.. from geometry(Point) to geometry(point)"
import { customType } from 'drizzle-orm/pg-core';
import { parseEWKB } from 'drizzle-orm/pg-core/columns/postgis_extension/utils';
export const geometryColumn = (name)=>customType({
        dataType () {
            return `geometry(Point)`;
        },
        fromDriver (value) {
            return parseEWKB(value);
        },
        toDriver (value) {
            return `SRID=4326;point(${value[0]} ${value[1]})`;
        }
    })(name);

//# sourceMappingURL=geometryColumn.js.map