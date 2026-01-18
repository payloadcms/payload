'use client';
import { useSlatePlugin } from '../../../utilities/useSlatePlugin.js';
import { uploadName } from './shared.js';
export const WithUpload = ()=>{
    useSlatePlugin('withUpload', (incomingEditor)=>{
        const editor = incomingEditor;
        const { isVoid } = editor;
        editor.isVoid = (element)=>element.type === uploadName ? true : isVoid(element);
        return editor;
    });
    return null;
};

//# sourceMappingURL=plugin.js.map