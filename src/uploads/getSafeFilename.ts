import sanitize from 'sanitize-filename';
import { CollectionModel } from '../collections/config/types';
import fileOrDocExists from './fileOrDocExists';

const incrementName = (name: string) => {
  const extension = name.split('.').pop();
  const baseFilename = sanitize(name.substr(0, name.lastIndexOf('.')) || name);
  let incrementedName = baseFilename;
  const regex = /(.*)-(\d)$/;
  const found = baseFilename.match(regex);
  if (found === null) {
    incrementedName += '-1';
  } else {
    const matchedName = found[1];
    const matchedNumber = found[2];
    const incremented = Number(matchedNumber) + 1;
    const newName = `${matchedName}-${incremented}`;
    incrementedName = newName;
  }
  return `${incrementedName}.${extension}`;
};

async function getSafeFileName(Model: CollectionModel, staticPath: string, desiredFilename: string): Promise<string> {
  let modifiedFilename = desiredFilename;

  // eslint-disable-next-line no-await-in-loop
  while (await fileOrDocExists(Model, staticPath, modifiedFilename)) {
    modifiedFilename = incrementName(modifiedFilename);
  }
  return modifiedFilename;
}

export default getSafeFileName;
