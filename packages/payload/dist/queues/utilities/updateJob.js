import { jobAfterRead, jobsCollectionSlug } from '../config/collection.js';
/**
 * Convenience method for updateJobs by id
 */ export async function updateJob(args) {
    const result = await updateJobs(args);
    if (result) {
        return result[0];
    }
}
/**
 * Helper for updating jobs in the most performant way possible.
 * Handles deciding whether it can used direct db methods or not, and if so,
 * manually runs the afterRead hook that populates the `taskStatus` property.
 */ export async function updateJobs({ id, data, depth, disableTransaction, limit: limitArg, req, returning, sort, where: whereArg }) {
    const limit = id ? 1 : limitArg;
    const where = id ? {
        id: {
            equals: id
        }
    } : whereArg;
    if (depth || req.payload.config?.jobs?.runHooks) {
        const result = await req.payload.update({
            id,
            collection: jobsCollectionSlug,
            data,
            depth,
            disableTransaction,
            limit,
            req,
            where
        });
        if (returning === false || !result) {
            return null;
        }
        return result.docs;
    }
    const jobReq = {
        transactionID: req.payload.db.name !== 'mongoose' ? await req.payload.db.beginTransaction() : undefined
    };
    if (typeof data.updatedAt === 'undefined') {
        // Ensure updatedAt date is always updated
        data.updatedAt = new Date().toISOString();
    }
    const args = id ? {
        id,
        data,
        req: jobReq,
        returning
    } : {
        data,
        limit,
        req: jobReq,
        returning,
        sort,
        where: where
    };
    const updatedJobs = await req.payload.db.updateJobs(args);
    if (req.payload.db.name !== 'mongoose' && jobReq.transactionID) {
        await req.payload.db.commitTransaction(jobReq.transactionID);
    }
    if (returning === false || !updatedJobs?.length) {
        return null;
    }
    return updatedJobs.map((updatedJob)=>{
        return jobAfterRead({
            config: req.payload.config,
            doc: updatedJob
        });
    });
}

//# sourceMappingURL=updateJob.js.map