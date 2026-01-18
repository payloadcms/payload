'use client';
import { useSlatePlugin } from '../../../utilities/useSlatePlugin.js';
import { relationshipName } from './shared.js';
export const WithRelationship = ()=>{
    useSlatePlugin('withRelationship', (incomingEditor)=>{
        const editor = incomingEditor;
        const { isVoid } = editor;
        editor.isVoid = (element)=>element.type === relationshipName ? true : isVoid(element);
        return editor;
    });
    return null;
};

//# sourceMappingURL=plugin.js.map