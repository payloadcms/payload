import { TFunction } from 'react-i18next';
import { SanitizedCollectionConfig } from '../../../../../collections/config/types';
import { Field } from '../../../../../fields/config/types';
declare const formatFields: (config: SanitizedCollectionConfig, t: TFunction) => Field[];
export default formatFields;
