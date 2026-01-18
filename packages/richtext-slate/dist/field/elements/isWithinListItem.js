import { Editor, Element } from 'slate';
export const isWithinListItem = (editor)=>{
    let parentLI;
    try {
        parentLI = Editor.parent(editor, editor.selection);
    } catch (e) {
    // swallow error, Slate
    }
    if (Element.isElement(parentLI?.[0]) && parentLI?.[0]?.type === 'li') {
        return true;
    }
    return false;
};

//# sourceMappingURL=isWithinListItem.js.map