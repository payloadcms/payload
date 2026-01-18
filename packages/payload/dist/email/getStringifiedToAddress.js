export const getStringifiedToAddress = (message)=>{
    let stringifiedTo;
    if (typeof message.to === 'string') {
        stringifiedTo = message.to;
    } else if (Array.isArray(message.to)) {
        stringifiedTo = message.to.map((to)=>{
            if (typeof to === 'string') {
                return to;
            } else if (to.address) {
                return to.address;
            }
            return '';
        }).join(', ');
    } else if (message.to?.address) {
        stringifiedTo = message.to.address;
    }
    return stringifiedTo;
};

//# sourceMappingURL=getStringifiedToAddress.js.map