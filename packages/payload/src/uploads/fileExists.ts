import fs from 'fs';

const fileExists = async (filename: string): Promise<boolean> => {
  try {
    await fs.promises.stat(filename);

    return true;
  } catch (err) {
    return false;
  }
};

export default fileExists;
