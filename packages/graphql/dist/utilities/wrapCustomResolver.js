import { isolateObjectProperty } from 'payload';
function wrapCustomResolver(resolver) {
    return (source, args, context, info)=>{
        return resolver(source, args, {
            ...context,
            req: isolateObjectProperty(context.req, 'transactionID')
        }, info);
    };
}
export function wrapCustomFields(fields) {
    for(const key in fields){
        if (fields[key].resolve) {
            fields[key].resolve = wrapCustomResolver(fields[key].resolve);
        }
    }
    return fields;
}

//# sourceMappingURL=wrapCustomResolver.js.map