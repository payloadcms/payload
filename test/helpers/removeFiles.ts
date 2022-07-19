import fs from 'fs';

const removeFiles = (dir) => {
  if (fs.existsSync(dir)) fs.readdirSync(dir).forEach((f) => fs.rmSync(`${dir}/${f}`));
};

export default removeFiles;
