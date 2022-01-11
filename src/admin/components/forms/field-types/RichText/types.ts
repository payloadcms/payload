import { BaseEditor, Selection } from 'slate';
import { RichTextField } from '../../../../../fields/config/types';

export type Props = Omit<RichTextField, 'type'> & {
  path?: string
}

export interface BlurSelectionEditor extends BaseEditor {
  blurSelection?: Selection
}
