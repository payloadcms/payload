import { stringify } from 'qs-esm';
export const buildSearchParams = (args)=>{
    const search = {};
    if (typeof args.depth === 'number') {
        search.depth = String(args.depth);
    }
    if (typeof args.page === 'number') {
        search.page = String(args.page);
    }
    if (typeof args.limit === 'number') {
        search.limit = String(args.limit);
    }
    if (typeof args.draft === 'boolean') {
        search.draft = String(args.draft);
    }
    if (typeof args.pagination === 'boolean') {
        search.pagination = String(args.pagination);
    }
    if (args.fallbackLocale) {
        search['fallback-locale'] = String(args.fallbackLocale);
    }
    if (args.locale) {
        search.locale = args.locale;
    }
    if (args.sort) {
        const sanitizedSort = Array.isArray(args.sort) ? args.sort.join(',') : args.sort;
        search.sort = sanitizedSort;
    }
    if (args.select) {
        search.select = args.select;
    }
    if (args.where) {
        search.where = args.where;
    }
    if (args.populate) {
        search.populate = args.populate;
    }
    if (args.joins) {
        search.joins = args.joins;
    }
    if (Object.keys(search).length > 0) {
        return stringify(search, {
            addQueryPrefix: true
        });
    }
    return '';
};

//# sourceMappingURL=buildSearchParams.js.map