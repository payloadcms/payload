import { Editor, Node } from 'slate';
import { isBlockElement } from './isBlockElement.js';
export const getCommonBlock = (editor, match)=>{
    const range = Editor.unhangRange(editor, editor.selection, {
        voids: true
    });
    const [common, path] = Node.common(editor, range.anchor.path, range.focus.path);
    if (isBlockElement(editor, common) || Editor.isEditor(common)) {
        return [
            common,
            path
        ];
    }
    return Editor.above(editor, {
        at: path,
        match: match || ((n)=>isBlockElement(editor, n) || Editor.isEditor(n))
    });
};

//# sourceMappingURL=getCommonBlock.js.map