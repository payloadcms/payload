import { jsx as _jsx } from "react/jsx-runtime";
import { CheckboxInput } from '../../fields/Checkbox/Input.js';
import { Popup } from '../Popup/index.js';
import './index.scss';
const baseClass = 'checkbox-popup';
export function CheckboxPopup({
  Button,
  className,
  onChange,
  options,
  selectedValues,
  ...popupProps
}) {
  return /*#__PURE__*/_jsx(Popup, {
    button: Button,
    className: [baseClass, className].filter(Boolean).join(' '),
    horizontalAlign: "right",
    render: ({
      close
    }) => /*#__PURE__*/_jsx("div", {
      className: `${baseClass}__options`,
      children: options.map(({
        label,
        value
      }) => /*#__PURE__*/_jsx(CheckboxInput, {
        checked: selectedValues?.includes(value),
        label: label,
        onToggle: () => {
          const newSelectedValues = selectedValues?.includes(value) ? selectedValues.filter(v => v !== value) : [...selectedValues, value];
          onChange({
            close,
            selectedValues: newSelectedValues
          });
        }
      }, value))
    }),
    showScrollbar: true,
    verticalAlign: "bottom",
    ...popupProps
  });
}
//# sourceMappingURL=index.js.map