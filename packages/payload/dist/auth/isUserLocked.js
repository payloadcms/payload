export const isUserLocked = (date)=>{
    if (!date) {
        return false;
    }
    return date.getTime() > Date.now();
};

//# sourceMappingURL=isUserLocked.js.map