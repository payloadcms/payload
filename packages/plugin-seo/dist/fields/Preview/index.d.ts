import type { UIField } from 'payload';
interface FieldFunctionProps {
    /**
     * Path to the description field to use for the preview
     *
     * @default 'meta.description'
     */
    descriptionPath?: string;
    /**
     * Tell the component if the generate function is available as configured in the plugin config
     */
    hasGenerateFn?: boolean;
    overrides?: Partial<UIField>;
    /**
     * Path to the title field to use for the preview
     *
     * @default 'meta.title'
     */
    titlePath?: string;
}
type FieldFunction = ({ hasGenerateFn, overrides }: FieldFunctionProps) => UIField;
export declare const PreviewField: FieldFunction;
export {};
//# sourceMappingURL=index.d.ts.map