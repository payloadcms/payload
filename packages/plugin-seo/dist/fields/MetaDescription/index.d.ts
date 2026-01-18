import type { TextareaField } from 'payload';
interface FieldFunctionProps {
    /**
     * Tell the component if the generate function is available as configured in the plugin config
     */
    hasGenerateFn?: boolean;
    overrides?: Partial<TextareaField>;
}
type FieldFunction = ({ hasGenerateFn, overrides }: FieldFunctionProps) => TextareaField;
export declare const MetaDescriptionField: FieldFunction;
export {};
//# sourceMappingURL=index.d.ts.map