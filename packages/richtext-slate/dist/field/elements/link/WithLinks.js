'use client';
import { useSlatePlugin } from '../../../utilities/useSlatePlugin.js';
const plugin = (incomingEditor)=>{
    const editor = incomingEditor;
    const { isInline } = editor;
    editor.isInline = (element)=>{
        if (element.type === 'link') {
            return true;
        }
        return isInline(element);
    };
    return editor;
};
export const WithLinks = ()=>{
    useSlatePlugin('withLinks', plugin);
    return null;
};

//# sourceMappingURL=WithLinks.js.map