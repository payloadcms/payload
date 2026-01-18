export const upsert = async function upsert({ collection, data, locale, req, returning, select, where }) {
    return this.updateOne({
        collection,
        data,
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