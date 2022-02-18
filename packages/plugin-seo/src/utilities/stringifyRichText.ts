export const stringifyRichText = (richText) => {
  let string = '';

  richText.forEach((node) => {
    const { children } = node;

    children.forEach((child) => {
      const { text } = child;
      string = string.concat(' ', text);
    });
  });

  return string;
};
