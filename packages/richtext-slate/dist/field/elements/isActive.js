import { Editor, Element } from 'slate';
export const isElementActive = (editor, format, blockType = 'type')=>{
    if (!editor.selection) {
        return false;
    }
    const [match] = Array.from(Editor.nodes(editor, {
        at: Editor.unhangRange(editor, editor.selection),
        match: (n)=>!Editor.isEditor(n) && Element.isElement(n) && n[blockType] === format
    }));
    return !!match;
};

//# sourceMappingURL=isActive.js.map