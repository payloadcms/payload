/**
 * @deprecated - will be removed in 4.0. Use query + $dynamic() instead: https://orm.drizzle.team/docs/dynamic-query-building
 */ /**
 * Call and returning methods that would normally be chained together but cannot be because of control logic
 * @param methods
 * @param query
 *
 * @deprecated - will be removed in 4.0. Use query + $dynamic() instead: https://orm.drizzle.team/docs/dynamic-query-building
 */ const chainMethods = ({ methods, query })=>{
    return methods.reduce((query, { args, method })=>{
        return query[method](...args);
    }, query);
};
export { chainMethods };

//# sourceMappingURL=chainMethods.js.map