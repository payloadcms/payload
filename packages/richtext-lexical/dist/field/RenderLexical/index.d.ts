import { type FieldType, type RenderFieldServerFnArgs } from '@payloadcms/ui';
import React from 'react';
import type { DefaultTypedEditorState } from '../../nodeTypes.js';
import type { LexicalRichTextField } from '../../types.js';
/**
 * Utility to render a lexical editor on the client.
 *
 * @experimental - may break in minor releases
 * @todo - replace this with a general utility that works for all fields. Maybe merge with packages/ui/src/forms/RenderFields/RenderField.tsx
 */
export declare const RenderLexical: React.FC<
/**
 * If value or setValue, or both, is provided, this component will manage its own value.
 * If neither is passed, it will rely on the parent form to manage the value.
 */
{
    /**
     * Override the loading state while the field component is being fetched and rendered.
     */
    Loading?: React.ReactElement;
    setValue?: FieldType<DefaultTypedEditorState | undefined>['setValue'];
    value?: FieldType<DefaultTypedEditorState | undefined>['value'];
} & RenderFieldServerFnArgs<LexicalRichTextField>>;
//# sourceMappingURL=index.d.ts.map