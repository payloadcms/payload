export const extractAccessFromPermission = (hasPermission)=>{
    if (typeof hasPermission === 'boolean') {
        return hasPermission;
    }
    const { permission, where } = hasPermission;
    if (!permission) {
        return false;
    }
    if (where && typeof where === 'object') {
        return where;
    }
    return true;
};

//# sourceMappingURL=extractAccessFromPermission.js.map