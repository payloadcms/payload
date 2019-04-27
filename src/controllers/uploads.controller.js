import mkdirp from 'mkdirp';
import { resize } from '../../src/utils/imageResizer';
import Media from '../models/Media.model';

function upload(req, res, next, config) {
  if (Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  mkdirp(config.staticDir, (err) => {
    if (err) {
      console.error(err);
      res.status(500).send('Upload failed.');
    }
  });

  let outputFilepath = `${config.staticDir}/${req.files.file.name}`;
  req.files.file.mv(outputFilepath, (err) => {
    if (err) return res.status(500).send(err);

    if (req.files.file.mimetype.split('/')[0] === 'image') {
      resize(config, req.files.file);
    }

    Media.create({
      name: req.files.file.name,
      filename: req.files.file.name
    }, (err, result) => {
      if (err)
        return res.status(500).json({ error: err });

      return res.status(201)
        .json({
          message: 'success',
          result: {
            id: result.id,
            name: result.name
          }
        });
    });
  })
}

export default { upload };
