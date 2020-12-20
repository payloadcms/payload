import { Action, AndClause, FieldCondition } from '../types';

export type Props = {
  fields: FieldCondition[],
  value: AndClause,
  dispatch: (action: Action) => void
  orIndex: number,
  andIndex: number,
}
