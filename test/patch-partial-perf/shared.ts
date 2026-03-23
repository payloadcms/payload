export { collectionSlug, TAGS_SLUG } from './generate.js'

export const COLLECTION_COUNT = Number(process.env.PERF_COLLECTIONS ?? 100)
export const UPDATE_COLLECTIONS = Number(process.env.PERF_UPDATE_COLLECTIONS ?? 20)
export const UPDATE_ITERATIONS = Number(process.env.PERF_UPDATE_ITERS ?? 50)
export const REDUCER_ITERATIONS = Number(process.env.PERF_REDUCER_ITERS ?? 200)
