import i18next from 'i18next';
import { SanitizedConfig } from '../../config/types';
import { SanitizedCollectionConfig } from '../../collections/config/types';
import { Field } from '../components/forms/Form/types';
export declare const formatUseAsTitle: (args: {
    field?: Field;
    doc?: Record<string, any>;
    collection: SanitizedCollectionConfig;
    i18n: typeof i18next;
    config: SanitizedConfig;
}) => string;
declare const useTitle: (collection: SanitizedCollectionConfig) => string;
export default useTitle;
