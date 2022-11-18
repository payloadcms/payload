import { EditorState, LexicalEditor } from 'lexical';
import { DateField } from '../../../../../fields/config/types';

export type Props = Omit<DateField, 'type'> & {
  path: string;
}

export type OnChangeProps = {
  onChange: (editorState: EditorState, editor: LexicalEditor) => void;
};
