import { getSelectMode } from '../../utilities/getSelectMode.js';
export const getQueryDraftsSelect = ({ select })=>{
    if (!select) {
        return;
    }
    const mode = getSelectMode(select);
    if (mode === 'include') {
        return {
            parent: true,
            version: select
        };
    }
    return {
        version: select
    };
};

//# sourceMappingURL=getQueryDraftsSelect.js.map