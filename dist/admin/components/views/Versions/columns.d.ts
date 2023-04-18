import { TFunction } from 'react-i18next';
import { Column } from '../../elements/Table/types';
import { SanitizedCollectionConfig } from '../../../../collections/config/types';
import { SanitizedGlobalConfig } from '../../../../globals/config/types';
export declare const buildVersionColumns: (collection: SanitizedCollectionConfig, global: SanitizedGlobalConfig, t: TFunction) => Column[];
