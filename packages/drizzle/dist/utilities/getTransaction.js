/**
 * Returns current db transaction instance from req or adapter.drizzle itself
 *
 * If a transaction session doesn't exist (e.g., it was already committed/rolled back),
 * falls back to the default adapter.drizzle instance to prevent errors.
 */ export const getTransaction = async (adapter, req)=>{
    if (!req?.transactionID) {
        return adapter.drizzle;
    }
    return adapter.sessions[await req.transactionID]?.db || adapter.drizzle;
};

//# sourceMappingURL=getTransaction.js.map