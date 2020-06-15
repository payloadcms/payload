function generateAPIKey() {
  let pass = '';
  const str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    + 'abcdefghijklmnopqrstuvwxyz0123456789@#$';

  for (let i = 1; i <= 36; i += 1) {
    const char = Math.floor(Math.random()
      * str.length + 1);

    pass += str.charAt(char);
  }

  return pass;
}

export default generateAPIKey;
