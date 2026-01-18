export const statusBeforeRead = ({ data })=>{
    if (data?.purchasedAt) {
        return 'purchased';
    }
    if (data?.createdAt) {
        const timeNow = new Date().getTime();
        const createdAt = new Date(data.createdAt).getTime();
        const differenceToCheck = 7 * 24 * 60 * 60 * 1000 // 7 days
        ;
        if (timeNow - createdAt < differenceToCheck) {
            // If the cart was created within the last 7 days, it is considered 'active'
            return 'active';
        }
    }
    return 'abandoned';
};

//# sourceMappingURL=statusBeforeRead.js.map