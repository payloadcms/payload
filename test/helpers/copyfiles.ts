import copyfiles from 'copyfiles';

export const copyfilesAsync = (paths: string[], options: unknown): Promise<void> => {
  return new Promise((resolve, reject) => {
    copyfiles(paths, options, (err, data) => {
      if (err) return reject(err);
      return resolve(data);
    });
  });
};
