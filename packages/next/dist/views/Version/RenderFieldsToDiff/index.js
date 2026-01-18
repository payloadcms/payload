import { jsx as _jsx } from "react/jsx-runtime";
import { buildVersionFields } from './buildVersionFields.js';
import { RenderVersionFieldsToDiff } from './RenderVersionFieldsToDiff.js';
export const RenderDiff = args => {
  const {
    versionFields
  } = buildVersionFields(args);
  return /*#__PURE__*/_jsx(RenderVersionFieldsToDiff, {
    parent: true,
    versionFields: versionFields
  });
};
//# sourceMappingURL=index.js.map