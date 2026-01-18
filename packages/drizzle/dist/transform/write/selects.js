import { isArrayOfRows } from '../../utilities/isArrayOfRows.js';
export const transformSelects = ({ id, data, locale })=>{
    const newRows = [];
    if (isArrayOfRows(data)) {
        data.forEach((value, i)=>{
            const newRow = {
                order: i + 1,
                parent: id,
                value
            };
            if (locale) {
                newRow.locale = locale;
            }
            newRows.push(newRow);
        });
    }
    return newRows;
};

//# sourceMappingURL=selects.js.map