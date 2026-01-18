import { APIError } from './APIError.js';
export class TimestampsRequired extends APIError {
    constructor(collection){
        super(`Timestamps are required in the collection ${collection.slug} because you have opted in to Versions.`);
    }
}

//# sourceMappingURL=TimestampsRequired.js.map