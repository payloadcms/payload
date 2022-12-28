import fs from 'fs';
import path from 'path';

export const dirnamePlugin = {
  name: 'dirname',
  setup(build) {
    build.onLoad({ filter: /\.(t|j)sx?$/ }, ({ path: filePath }) => {
      let contents = fs.readFileSync(filePath, 'utf8');
      const loader = path.extname(filePath).substring(1);
      const dirname = path.dirname(filePath);
      contents = contents
        .replace(/__dirname/g, `"${dirname}"`)
        .replace(/__filename/g, `"${filePath}"`);
      return {
        contents,
        loader,
      };
    });
  },
};
