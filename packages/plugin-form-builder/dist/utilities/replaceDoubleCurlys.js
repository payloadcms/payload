import { keyValuePairToHtmlTable } from './keyValuePairToHtmlTable.js';
export const replaceDoubleCurlys = (str, variables)=>{
    const regex = /\{\{(.+?)\}\}/g;
    if (str && variables) {
        return str.replace(regex, (_, variable)=>{
            if (variable.includes('*')) {
                if (variable === '*') {
                    return variables.map(({ field, value })=>`${field} : ${value}`).join(' <br /> ');
                } else if (variable === '*:table') {
                    return keyValuePairToHtmlTable(variables.reduce((acc, { field, value })=>{
                        acc[field] = value;
                        return acc;
                    }, {}));
                }
            } else {
                const foundVariable = variables.find(({ field: fieldName })=>{
                    return variable === fieldName;
                });
                if (foundVariable) {
                    return foundVariable.value;
                }
            }
            return variable;
        });
    }
    return str;
};

//# sourceMappingURL=replaceDoubleCurlys.js.map