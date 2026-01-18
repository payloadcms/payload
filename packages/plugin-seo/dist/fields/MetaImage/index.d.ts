import type { UploadField } from 'payload';
interface FieldFunctionProps {
    /**
     * Tell the component if the generate function is available as configured in the plugin config
     */
    hasGenerateFn?: boolean;
    overrides?: Partial<UploadField>;
    relationTo: string;
}
type FieldFunction = ({ hasGenerateFn, overrides }: FieldFunctionProps) => UploadField;
export declare const MetaImageField: FieldFunction;
export {};
//# sourceMappingURL=index.d.ts.map