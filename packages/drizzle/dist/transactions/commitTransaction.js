export const commitTransaction = async function commitTransaction(incomingID = '') {
    const transactionID = incomingID instanceof Promise ? await incomingID : incomingID;
    // if the session was deleted it has already been aborted
    if (!this.sessions[transactionID]) {
        return;
    }
    const session = this.sessions[transactionID];
    // Delete from registry FIRST to prevent race conditions
    // This ensures other operations can't retrieve this session while we're ending it
    delete this.sessions[transactionID];
    try {
        await session.resolve();
    } catch (_) {
        await session.reject();
    }
};

//# sourceMappingURL=commitTransaction.js.map