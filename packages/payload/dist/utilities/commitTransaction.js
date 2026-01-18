/**
 * complete a transaction calling adapter db.commitTransaction and delete the transactionID from req
 */ export async function commitTransaction(req) {
    const { payload, transactionID } = req;
    await payload.db.commitTransaction(transactionID);
    delete req.transactionID;
}

//# sourceMappingURL=commitTransaction.js.map