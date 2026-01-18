import { and, eq, gt, gte, ilike, inArray, isNotNull, isNull, lt, lte, ne, notIlike, notInArray, or } from 'drizzle-orm';
export const operatorMap = {
    and,
    contains: ilike,
    equals: eq,
    exists: isNotNull,
    greater_than: gt,
    greater_than_equal: gte,
    in: inArray,
    isNull,
    less_than: lt,
    less_than_equal: lte,
    like: ilike,
    not_equals: ne,
    not_like: notIlike,
    // TODO: support this
    // all: all,
    not_in: notInArray,
    or
};

//# sourceMappingURL=operatorMap.js.map