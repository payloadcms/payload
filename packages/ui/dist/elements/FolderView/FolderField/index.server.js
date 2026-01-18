import { jsx as _jsx } from "react/jsx-runtime";
// eslint-disable-next-line payload/no-imports-from-exports-dir
import { MoveDocToFolder } from '../../../exports/client/index.js';
import './index.scss';
const baseClass = 'folder-edit-field';
export const FolderField = props => {
  if (props.payload.config.folders === false) {
    return null;
  }
  return /*#__PURE__*/_jsx(MoveDocToFolder, {
    className: baseClass,
    folderCollectionSlug: props.payload.config.folders.slug,
    folderFieldName: props.payload.config.folders.fieldName
  });
};
//# sourceMappingURL=index.server.js.map