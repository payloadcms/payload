export const unsubscribe = (callback)=>{
    if (typeof window !== 'undefined') {
        window.removeEventListener('message', callback);
    }
};

//# sourceMappingURL=unsubscribe.js.map