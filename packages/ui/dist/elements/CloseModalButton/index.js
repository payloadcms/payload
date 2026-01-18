import { jsx as _jsx } from "react/jsx-runtime";
import { useModal } from '@faceless-ui/modal';
import { XIcon } from '../../icons/X/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import './index.scss';
const baseClass = 'close-modal-button';
export function CloseModalButton({
  slug,
  className
}) {
  const {
    closeModal
  } = useModal();
  const {
    t
  } = useTranslation();
  return /*#__PURE__*/_jsx("button", {
    "aria-label": t('general:close'),
    className: [baseClass, className].filter(Boolean).join(' '),
    onClick: () => {
      closeModal(slug);
    },
    type: "button",
    children: /*#__PURE__*/_jsx(XIcon, {})
  }, "close-button");
}
//# sourceMappingURL=index.js.map