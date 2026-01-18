export const upsert = async function upsert({ collection, data, joins, locale, req, returning, select, where }) {
    return this.updateOne({
        collection,
        data,
        joins,
        locale,
        options: {
            upsert: true
        },
        req,
        returning,
        select,
        where
    });
};

//# sourceMappingURL=upsert.js.map