import { validateMimeType } from '../utilities/validateMimeType.js';
export const mimeTypeValidator = (mimeTypes)=>(val, { siblingData })=>{
        if (!siblingData.filename) {
            return true;
        }
        if (!val) {
            return 'Invalid file type';
        }
        const isValidMimeType = validateMimeType(val, mimeTypes);
        return isValidMimeType ? true : `Invalid file type: '${val}'`;
    };

//# sourceMappingURL=mimeTypeValidator.js.map