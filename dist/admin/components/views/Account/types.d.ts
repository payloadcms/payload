import { SanitizedCollectionConfig } from '../../../../collections/config/types';
import { Fields, Data } from '../../forms/Form/types';
import { CollectionPermission } from '../../../../auth/types';
export type Props = {
    hasSavePermission: boolean;
    apiURL: string;
    collection: SanitizedCollectionConfig;
    data: Data;
    permissions: CollectionPermission;
    initialState: Fields;
    isLoading: boolean;
    action: string;
    onSave?: () => void;
};
