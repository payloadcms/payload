export const getSelectMode = (select)=>{
    for(const key in select){
        const selectValue = select[key];
        if (selectValue === false) {
            return 'exclude';
        }
        if (typeof selectValue === 'object') {
            return getSelectMode(selectValue);
        }
    }
    return 'include';
};

//# sourceMappingURL=getSelectMode.js.map