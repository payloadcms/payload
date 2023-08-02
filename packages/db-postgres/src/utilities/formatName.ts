export const formatName = (string: string): string => {
  const formatted = string
    // Convert accented characters
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')

    .replace(/\./g, '_')
    .replace(/-|\//g, '_')
    .replace(/\+/g, '_')
    .replace(/,/g, '_')
    .replace(/\(/g, '_')
    .replace(/\)/g, '_')
    .replace(/'/g, '_')
    .replace(/ /g, '');

  return formatted;
};
