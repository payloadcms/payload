import { ValidationError } from 'payload';
function extractFieldFromMessage(message) {
    // eslint-disable-next-line regexp/no-super-linear-backtracking
    const match = message.match(/index:\s*(.*?)_/);
    if (match && match[1]) {
        return match[1] // e.g., returns "email" from "index: email_1"
        ;
    }
    return null;
}
export const handleError = ({ collection, error, global, req })=>{
    if (!error || typeof error !== 'object') {
        throw error;
    }
    // Handle uniqueness error from MongoDB
    if ('code' in error && error.code === 11000) {
        let path = null;
        if ('keyValue' in error && error.keyValue && typeof error.keyValue === 'object') {
            path = Object.keys(error.keyValue)[0] ?? '';
        } else if ('message' in error && typeof error.message === 'string') {
            path = extractFieldFromMessage(error.message);
        }
        throw new ValidationError({
            collection,
            errors: [
                {
                    message: req?.t ? req.t('error:valueMustBeUnique') : 'Value must be unique',
                    path: path ?? ''
                }
            ],
            global
        }, req?.t);
    }
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw error;
};

//# sourceMappingURL=handleError.js.map