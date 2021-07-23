export type Props = {
  description?: string | ((value) => string);
  CustomComponent?: React.ComponentType<{ value: unknown }>;
  value: unknown;
}
