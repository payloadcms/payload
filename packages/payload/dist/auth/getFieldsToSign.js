import { fieldAffectsData, tabHasName } from '../fields/config/types.js';
const traverseFields = ({ data, // parent,
fields, result })=>{
    fields.forEach((field)=>{
        switch(field.type){
            case 'collapsible':
            case 'row':
                {
                    traverseFields({
                        data,
                        fields: field.fields,
                        result
                    });
                    break;
                }
            case 'group':
                {
                    if (fieldAffectsData(field)) {
                        let targetResult;
                        if (typeof field.saveToJWT === 'string') {
                            targetResult = field.saveToJWT;
                            result[field.saveToJWT] = data[field.name];
                        } else if (field.saveToJWT) {
                            targetResult = field.name;
                            result[field.name] = data[field.name];
                        }
                        const groupData = data[field.name];
                        const groupResult = targetResult ? result[targetResult] : result;
                        traverseFields({
                            data: groupData,
                            fields: field.fields,
                            result: groupResult
                        });
                        break;
                    } else {
                        traverseFields({
                            data,
                            fields: field.fields,
                            result
                        });
                        break;
                    }
                }
            case 'tab':
                {
                    if (tabHasName(field)) {
                        let targetResult;
                        if (typeof field.saveToJWT === 'string') {
                            targetResult = field.saveToJWT;
                            result[field.saveToJWT] = data[field.name];
                        } else if (field.saveToJWT) {
                            targetResult = field.name;
                            result[field.name] = data[field.name];
                        }
                        const tabData = data[field.name];
                        const tabResult = targetResult ? result[targetResult] : result;
                        traverseFields({
                            data: tabData,
                            fields: field.fields,
                            result: tabResult
                        });
                    } else {
                        traverseFields({
                            data,
                            fields: field.fields,
                            result
                        });
                    }
                    break;
                }
            case 'tabs':
                {
                    traverseFields({
                        data,
                        fields: field.tabs.map((tab)=>({
                                ...tab,
                                type: 'tab'
                            })),
                        result
                    });
                    break;
                }
            default:
                if (fieldAffectsData(field)) {
                    if (field.saveToJWT) {
                        if (typeof field.saveToJWT === 'string') {
                            result[field.saveToJWT] = data[field.name];
                            delete result[field.name];
                        } else {
                            result[field.name] = data[field.name];
                        }
                    } else if (field.saveToJWT === false) {
                        delete result[field.name];
                    }
                }
        }
    });
    return result;
};
export const getFieldsToSign = (args)=>{
    const { collectionConfig, email, sid, user } = args;
    const result = {
        id: user?.id,
        collection: collectionConfig.slug,
        email
    };
    if (sid) {
        result.sid = sid;
    }
    traverseFields({
        data: user,
        fields: collectionConfig.fields,
        result
    });
    return result;
};

//# sourceMappingURL=getFieldsToSign.js.map