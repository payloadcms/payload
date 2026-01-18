export const createUploadTimer = (timeout = 0, callback = ()=>{})=>{
    let timer = null;
    const clear = ()=>{
        clearTimeout(timer);
    };
    const set = ()=>{
        // Do not start a timer if zero timeout or it hasn't been set.
        if (!timeout) {
            return false;
        }
        clear();
        timer = setTimeout(callback, timeout);
        return true;
    };
    return {
        clear,
        set
    };
};

//# sourceMappingURL=uploadTimer.js.map