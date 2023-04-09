"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDataLoader = void 0;
const dataloader_1 = __importDefault(require("dataloader"));
const isValidID_1 = require("../utilities/isValidID");
const getIDType_1 = require("../utilities/getIDType");
const types_1 = require("../fields/config/types");
// Payload uses `dataloader` to solve the classic GraphQL N+1 problem.
// We keep a list of all documents requested to be populated for any given request
// and then batch together documents within the same collection,
// making only 1 find per each collection, rather than `findByID` per each requested doc.
// This dramatically improves performance for REST and Local API `depth` populations,
// and also ensures complex GraphQL queries perform lightning-fast.
const batchAndLoadDocs = (req) => async (keys) => {
    const { payload } = req;
    // Create docs array of same length as keys, using null as value
    // We will replace nulls with injected docs as they are retrieved
    const docs = keys.map(() => null);
    // Batch IDs by their `find` args
    // so we can make one find query per combination of collection, depth, locale, and fallbackLocale.
    // Resulting shape will be as follows:
    // {
    //   // key is stringified set of find args
    //   '["pages",2,0,"es","en",false,false]': [
    //     // value is array of IDs to find with these args
    //     'q34tl23462346234524',
    //     '435523540194324280',
    //     '2346245j35l3j5234532li',
    //   ],
    //   // etc
    // };
    const batchByFindArgs = keys.reduce((batches, key) => {
        var _a;
        const [collection, id, depth, currentDepth, locale, fallbackLocale, overrideAccess, showHiddenFields] = JSON.parse(key);
        const batchKeyArray = [
            collection,
            depth,
            currentDepth,
            locale,
            fallbackLocale,
            overrideAccess,
            showHiddenFields,
        ];
        const batchKey = JSON.stringify(batchKeyArray);
        const idField = (_a = payload.collections) === null || _a === void 0 ? void 0 : _a[collection].config.fields.find((field) => (0, types_1.fieldAffectsData)(field) && field.name === 'id');
        if ((0, isValidID_1.isValidID)(id, (0, getIDType_1.getIDType)(idField))) {
            return {
                ...batches,
                [batchKey]: [
                    ...batches[batchKey] || [],
                    id,
                ],
            };
        }
        return batches;
    }, {});
    // Run find requests in parallel
    const results = Object.entries(batchByFindArgs).map(async ([batchKey, ids]) => {
        const [collection, depth, currentDepth, locale, fallbackLocale, overrideAccess, showHiddenFields] = JSON.parse(batchKey);
        const result = await payload.find({
            collection,
            locale,
            fallbackLocale,
            depth,
            currentDepth,
            pagination: false,
            where: {
                id: {
                    in: ids,
                },
            },
            overrideAccess: Boolean(overrideAccess),
            showHiddenFields: Boolean(showHiddenFields),
            disableErrors: true,
            req,
        });
        // For each returned doc, find index in original keys
        // Inject doc within docs array if index exists
        result.docs.forEach((doc) => {
            const docKey = JSON.stringify([collection, doc.id, depth, currentDepth, locale, fallbackLocale, overrideAccess, showHiddenFields]);
            const docsIndex = keys.findIndex((key) => key === docKey);
            if (docsIndex > -1) {
                docs[docsIndex] = doc;
            }
        });
    });
    await Promise.all(results);
    // Return docs array,
    // which has now been injected with all fetched docs
    // and should match the length of the incoming keys arg
    return docs;
};
const getDataLoader = (req) => new dataloader_1.default(batchAndLoadDocs(req));
exports.getDataLoader = getDataLoader;
//# sourceMappingURL=dataloader.js.map