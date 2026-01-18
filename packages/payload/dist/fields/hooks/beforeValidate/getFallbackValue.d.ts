import type { JsonObject, JsonValue, PayloadRequest } from '../../../types/index.js';
import type { FieldAffectingData } from '../../config/types.js';
export declare function getFallbackValue({ field, req, siblingDoc, }: {
    field: FieldAffectingData;
    req: PayloadRequest;
    siblingDoc: JsonObject;
}): Promise<JsonValue>;
//# sourceMappingURL=getFallbackValue.d.ts.map