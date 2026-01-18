export function reduceFormStateByPath({
  formState,
  path,
  rowIndex
}) {
  const filteredState = {};
  const prefix = typeof rowIndex !== 'number' ? path : `${path}.${rowIndex}`;
  for (const key in formState) {
    if (!key.startsWith(prefix)) {
      continue;
    }
    const {
      customComponents: _,
      validate: __,
      ...field
    } = formState[key];
    if (Array.isArray(field.rows)) {
      field.rows = field.rows.map(row => {
        if (!row || typeof row !== 'object') {
          return row;
        }
        const {
          customComponents: _,
          ...serializableRow
        } = row;
        return serializableRow;
      });
    }
    filteredState[key] = field;
  }
  return filteredState;
}
export function mergeFormStateFromClipboard({
  dataFromClipboard: clipboardData,
  formState,
  path,
  rowIndex
}) {
  const {
    type: typeFromClipboard,
    data: dataFromClipboard,
    path: pathFromClipboard,
    rowIndex: rowIndexFromClipboard
  } = clipboardData;
  const copyFromField = typeof rowIndexFromClipboard !== 'number';
  const pasteIntoField = typeof rowIndex !== 'number';
  const fromRowToField = !copyFromField && pasteIntoField;
  const isArray = typeFromClipboard === 'array';
  let pathToReplace;
  if (copyFromField && pasteIntoField) {
    pathToReplace = pathFromClipboard;
  } else if (copyFromField) {
    pathToReplace = `${pathFromClipboard}.${rowIndex}`;
  } else {
    pathToReplace = `${pathFromClipboard}.${rowIndexFromClipboard}`;
  }
  let targetSegment;
  if (!pasteIntoField) {
    targetSegment = `${path}.${rowIndex}`;
  } else if (fromRowToField) {
    targetSegment = `${path}.0`;
  } else {
    targetSegment = path;
  }
  if (fromRowToField) {
    const lastRenderedPath = `${path}.0`;
    const rowIDFromClipboard = dataFromClipboard[`${pathToReplace}.id`].value;
    const hasRows = formState[path].rows?.length;
    formState[path].rows = [{
      ...(hasRows && isArray ? formState[path].rows[0] : {}),
      id: rowIDFromClipboard,
      isLoading: false,
      lastRenderedPath
    }];
    formState[path].value = 1;
    formState[path].initialValue = 1;
    formState[path].disableFormData = true;
    for (const fieldPath in formState) {
      if (fieldPath !== path && !fieldPath.startsWith(lastRenderedPath) && fieldPath.startsWith(path)) {
        delete formState[fieldPath];
      }
    }
  }
  for (const clipboardPath in dataFromClipboard) {
    // Pasting a row id, skip overwriting
    if (!pasteIntoField && clipboardPath.endsWith('.id') || !clipboardPath.startsWith(pathToReplace)) {
      continue;
    }
    const newPath = clipboardPath.replace(pathToReplace, targetSegment);
    const customComponents = isArray ? formState[newPath]?.customComponents : undefined;
    const validate = isArray ? formState[newPath]?.validate : undefined;
    formState[newPath] = {
      customComponents,
      validate,
      ...dataFromClipboard[clipboardPath]
    };
  }
  return formState;
}
//# sourceMappingURL=mergeFormStateFromClipboard.js.map