import { generateFormCollection } from './collections/Forms/index.js';
import { generateSubmissionCollection } from './collections/FormSubmissions/index.js';
export { fields } from './collections/Forms/fields.js';
export { getPaymentTotal } from './utilities/getPaymentTotal.js';
export const formBuilderPlugin = (incomingFormConfig)=>(config)=>{
        const formConfig = {
            ...incomingFormConfig,
            fields: {
                checkbox: true,
                country: true,
                email: true,
                message: true,
                number: true,
                payment: false,
                select: true,
                state: true,
                text: true,
                textarea: true,
                ...incomingFormConfig.fields
            }
        };
        return {
            ...config,
            collections: [
                ...config?.collections || [],
                generateFormCollection(formConfig),
                generateSubmissionCollection(formConfig)
            ]
        };
    };

//# sourceMappingURL=index.js.map