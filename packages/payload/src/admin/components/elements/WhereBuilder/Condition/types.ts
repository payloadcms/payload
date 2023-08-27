import { Where } from '../../../../../types.js';
import { Action, FieldCondition } from '../types.js';

export type Props = {
  fields: FieldCondition[],
  value: Where,
  dispatch: (action: Action) => void
  orIndex: number,
  andIndex: number,
}
