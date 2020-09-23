import elementTypes from './elementTypes';
import leafTypes from './leafTypes';

const enablePlugins = (CreatedEditor, functions) => functions.reduce((CreatedEditorWithPlugins, func) => {
  if (typeof func === 'object' && typeof func.plugin === 'function') {
    return func.plugin(CreatedEditorWithPlugins);
  }

  if (typeof func === 'string') {
    if (elementTypes[func] && elementTypes[func].plugin) {
      return elementTypes[func].plugin(CreatedEditorWithPlugins);
    }

    if (leafTypes[func] && leafTypes[func].plugin) {
      return leafTypes[func].plugin(CreatedEditorWithPlugins);
    }
  }

  return CreatedEditorWithPlugins;
}, CreatedEditor);

export default enablePlugins;
