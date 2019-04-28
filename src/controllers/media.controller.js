import mkdirp from 'mkdirp';
import { resize } from '../utils/imageResizer';

function upload(req, res, next, mediaModel, config) {
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

    mediaModel.create({
      name: req.body.name,
      caption: req.body.caption,
      description: req.body.description,
      filename: req.files.file.name
    }, (mediaCreateError, result) => {
      if (mediaCreateError)
        return res.status(500).json({ error: mediaCreateError });

      return res.status(201)
        .json({
          id: result.id,
          name: result.name,
          description: result.description,
          filename: result.filename
        });
    });
  })
}

export default { upload };
