import type { LabelFunction } from 'payload';
import type { CommonProps, GroupBase, Props as ReactSelectStateManagerProps } from 'react-select';
import type { DocumentDrawerProps } from '../DocumentDrawer/types.js';
type CustomSelectProps = {
    disableKeyDown?: boolean;
    disableMouseDown?: boolean;
    draggableProps?: any;
    droppableRef?: React.RefObject<HTMLDivElement | null>;
    editableProps?: (data: Option<{
        label: string;
        value: string;
    }>, className: string, selectProps: ReactSelectStateManagerProps) => any;
    onDelete?: DocumentDrawerProps['onDelete'];
    onDocumentOpen?: (args: {
        collectionSlug: string;
        hasReadPermission: boolean;
        id: number | string;
        openInNewTab?: boolean;
    }) => void;
    onDuplicate?: DocumentDrawerProps['onSave'];
    onSave?: DocumentDrawerProps['onSave'];
    valueContainerLabel?: string;
};
declare module 'react-select/dist/declarations/src/Select' {
    interface Props<Option, IsMulti extends boolean, Group extends GroupBase<Option>> {
        customProps?: CustomSelectProps;
    }
}
declare module 'react-select/dist/declarations/src' {
    interface CommonPropsAndClassName<Option, IsMulti extends boolean, Group extends GroupBase<Option>> extends CommonProps<Option, IsMulti, Group> {
        customProps?: CustomSelectProps & ReactSelectStateManagerProps<Option, IsMulti, Group>;
    }
}
export type Option<TValue = unknown> = {
    [key: string]: unknown;
    id?: string;
    value: TValue;
};
export type OptionGroup = {
    label: string;
    options: Option[];
};
export type ReactSelectAdapterProps = {
    backspaceRemovesValue?: boolean;
    blurInputOnSelect?: boolean;
    className?: string;
    components?: {
        [key: string]: React.FC<any>;
    };
    customProps?: CustomSelectProps;
    disabled?: boolean;
    filterOption?: (({ allowEdit, data, label, value, }: {
        allowEdit: boolean;
        data: Option;
        label: string;
        value: string;
    }, search: string) => boolean) | undefined;
    getOptionValue?: ReactSelectStateManagerProps<Option, boolean, GroupBase<Option>>['getOptionValue'];
    id?: string;
    inputId?: string;
    isClearable?: boolean;
    /** Allows you to create own values in the UI despite them not being pre-specified */
    isCreatable?: boolean;
    isLoading?: boolean;
    /** Allows you to specify multiple values instead of just one */
    isMulti?: boolean;
    isOptionSelected?: any;
    isSearchable?: boolean;
    isSortable?: boolean;
    menuIsOpen?: boolean;
    noOptionsMessage?: (obj: {
        inputValue: string;
    }) => string;
    numberOnly?: boolean;
    onChange?: (value: Option | Option[]) => void;
    onInputChange?: (val: string) => void;
    onMenuClose?: () => void;
    onMenuOpen?: () => void;
    onMenuScrollToBottom?: () => void;
    options: Option[] | OptionGroup[];
    placeholder?: LabelFunction | string;
    showError?: boolean;
    value?: Option | Option[];
};
export {};
//# sourceMappingURL=types.d.ts.map