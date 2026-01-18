import { jsx as _jsx } from "react/jsx-runtime";
function kebabToCamelCase(str) {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}
export const TextStateIcon = ({
  css
}) => {
  const convertedCss = css ? Object.fromEntries(Object.entries(css).map(([key, value]) => [kebabToCamelCase(key), value])) : {};
  return /*#__PURE__*/_jsx("span", {
    style: {
      ...convertedCss,
      alignItems: 'center',
      borderRadius: '4px',
      display: 'flex',
      fontSize: '16px',
      height: '20px',
      justifyContent: 'center',
      width: '20px'
    },
    children: "A"
  });
};
//# sourceMappingURL=index.js.map