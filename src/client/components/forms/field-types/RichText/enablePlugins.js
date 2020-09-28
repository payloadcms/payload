import elementTypes from './elements';
import leafTypes from './leaves';

const addPluginReducer = (EditorWithPlugins, plugin) => {
  if (typeof plugin === 'function') return plugin(EditorWithPlugins);
  return EditorWithPlugins;
};

const enablePlugins = (CreatedEditor, functions) => functions.reduce((CreatedEditorWithPlugins, func) => {
  if (typeof func === 'object' && Array.isArray(func.plugins)) {
    return func.plugins.reduce(addPluginReducer, CreatedEditorWithPlugins);
  }

  if (typeof func === 'string') {
    if (elementTypes[func] && elementTypes[func].plugins) {
      return elementTypes[func].plugins.reduce(addPluginReducer, CreatedEditorWithPlugins);
    }

    if (leafTypes[func] && leafTypes[func].plugins) {
      return leafTypes[func].plugins.reduce(addPluginReducer, CreatedEditorWithPlugins);
    }
  }

  return CreatedEditorWithPlugins;
}, CreatedEditor);

export default enablePlugins;
