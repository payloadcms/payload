import { accessOperation, isolateObjectProperty } from 'payload';
import { formatName } from '../../utilities/formatName.js';
const formatConfigNames = (results, configs)=>{
    const formattedResults = {
        ...results
    };
    configs.forEach(({ slug })=>{
        const result = {
            ...formattedResults[slug] || {}
        };
        delete formattedResults[slug];
        formattedResults[formatName(slug)] = result;
    });
    return formattedResults;
};
export function accessResolver(config) {
    async function resolver(_, args, context) {
        const options = {
            req: isolateObjectProperty(context.req, 'transactionID')
        };
        const accessResults = await accessOperation(options);
        return {
            ...accessResults,
            ...formatConfigNames(accessResults.collections, config.collections),
            ...formatConfigNames(accessResults.globals, config.globals)
        };
    }
    return resolver;
}

//# sourceMappingURL=access.js.map