import { Field } from '../../../../../../../../fields/config/types';
import { Fields } from '../../../../../Form/types';
export type Props = {
    drawerSlug: string;
    handleClose: () => void;
    handleModalSubmit: (fields: Fields, data: Record<string, unknown>) => void;
    initialState?: Fields;
    fieldSchema: Field[];
};
