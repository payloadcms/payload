import type { TextField } from 'payload';
interface FieldFunctionProps {
    /**
     * Tell the component if the generate function is available as configured in the plugin config
     */
    hasGenerateFn?: boolean;
    overrides?: Partial<TextField>;
}
type FieldFunction = ({ hasGenerateFn, overrides }: FieldFunctionProps) => TextField;
export declare const MetaTitleField: FieldFunction;
export {};
//# sourceMappingURL=index.d.ts.map