import React, { useEffect } from 'react';
import { useAuth } from '../../utilities/Auth';
import { useAllFormFields } from '../Form/context';
import { useDocumentInfo } from '../../utilities/DocumentInfo';
import reduceFieldsToValues from '../Form/reduceFieldsToValues';
import getSiblingData from '../Form/getSiblingData';
import { Condition } from '../../../../fields/config/types';

type Props = {
  path?: string
  name: string
  condition: Condition
  setShowField: (isVisible: boolean) => void
}

export const WatchCondition: React.FC<Props> = ({
  path: pathFromProps,
  name,
  condition,
  setShowField,
}) => {
  const path = typeof pathFromProps === 'string' ? pathFromProps : name;

  const { user } = useAuth();
  const [fields, dispatchFields] = useAllFormFields();
  const { id } = useDocumentInfo();

  const data = reduceFieldsToValues(fields, true);
  const siblingData = getSiblingData(fields, path);

  // Manually provide ID to `data`
  data.id = id;

  const hasCondition = Boolean(condition);
  const isPassingCondition = hasCondition ? condition(data, siblingData, { user }) : true;
  const field = fields[path];

  const wasPassingCondition = field?.passesCondition;

  useEffect(() => {
    if (hasCondition) {
      if (isPassingCondition && !wasPassingCondition) {
        dispatchFields({ type: 'MODIFY_CONDITION', path, result: true, user });
      }

      if (!isPassingCondition && (wasPassingCondition || typeof wasPassingCondition === 'undefined')) {
        dispatchFields({ type: 'MODIFY_CONDITION', path, result: false, user });
      }
    }
  }, [isPassingCondition, wasPassingCondition, dispatchFields, path, hasCondition, user, setShowField]);

  useEffect(() => {
    setShowField(isPassingCondition);
  }, [setShowField, isPassingCondition]);

  return null;
};
