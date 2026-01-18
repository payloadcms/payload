/**
 * Renders a CustomComponent or a Fallback component.
 * Only fallback if the Custom Component is undefined.
 *
 * If the CustomComponent is null, render null.
 *
 * @param {Object} args - Arguments object.
 * @param {React.ReactNode} [args.CustomComponent] - Optional custom component to render.
 * @param {React.ReactNode} args.Fallback - Fallback component to render if CustomComponent is undefined.
 * @returns {React.ReactNode} Rendered component.
 */export function RenderCustomComponent({
  CustomComponent,
  Fallback
}) {
  return CustomComponent !== undefined ? CustomComponent : Fallback;
}
//# sourceMappingURL=index.js.map