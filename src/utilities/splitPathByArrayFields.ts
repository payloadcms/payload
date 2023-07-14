/**
  Turns: 'arrayField.0.group123field.arrayField.0.textField'

  Into: ['arrayField', '0', 'group123field.arrayField', '0', 'textField']
*/
export function splitPathByArrayFields(str: string): string[] {
  const regex = /\.(\d+)\./g;
  return str.split(regex).filter(Boolean);
}
