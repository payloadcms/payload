import mkdirp from 'mkdirp';
import { resizeAndSave } from './imageResizer';
import httpStatus from 'http-status';
import modelById from '../mongoose/resolvers/modelById';

export async function update(req, res, next, config) {
  req.model.setDefaultLocale(req.locale);

  const query = {
    Model: req.model,
    id: req.params._id,
    locale: req.locale,
  };
  let doc = await modelById(query, { returnRawDoc: true });
  if (!doc)
    return res.status(httpStatus.NOT_FOUND).send('Not Found');

  Object.keys(req.body).forEach(e => {
    doc[e] = req.body[e];
  });

  if (req.files && req.files.file) {
    doc['filename'] = req.files.file.name;
    let outputFilepath = `${config.staticDir}/${req.files.file.name}`;
    let moveError = await req.files.file.mv(outputFilepath);
    if (moveError) return res.status(500).send(moveError);
    doc['sizes'] = await resizeAndSave(config, req.files.file);
  }

  doc.save((saveError) => {
    if (saveError)
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: saveError });

    return res.json({
      message: 'success',
      result: doc.toJSON({ virtuals: true })
    });
  });
}

export async function upload(req, res, next, config) {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  mkdirp(config.staticDir, (err) => {
    if (err) {
      console.error(err);
      res.status(500).send('Upload failed.');
    }
  });

  let outputFilepath = `${config.staticDir}/${req.files.file.name}`;
  let moveError = await req.files.file.mv(outputFilepath);
  if (moveError) return res.status(500).send(moveError);
  let outputSizes = await resizeAndSave(config, req.files.file);

  req.model.create({
    name: req.body.name,
    caption: req.body.caption,
    description: req.body.description,
    filename: req.files.file.name,
    sizes: outputSizes
  }, (mediaCreateError, result) => {
    if (mediaCreateError)
      return res.status(500).json({ error: mediaCreateError });

    return res.status(201)
      .json({
        message: 'success',
        result: result.toJSON({ virtuals: true })
      });
  });
}
