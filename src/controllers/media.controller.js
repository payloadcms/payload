import mkdirp from 'mkdirp';
import { resizeAndSave } from '../utils/imageResizer';
import httpStatus from '../requestHandlers/update';
import findOne from '../requestHandlers/findOne';

export async function update(req, res, next, config) {
  req.model.setDefaultLocale(req.locale);

  // ISSUE: This is not actually a doc that is returned
  // It is a doc.toJSON, which is why the doc.save() fails
  let doc = await findOne(req);
  if (!doc)
    return res.status(httpStatus.NOT_FOUND).send('Not Found');

  Object.keys(req.body).forEach(e => {
    doc[e] = req.body[e];
  });

  if (req.files && req.files.file) {
    let outputFilepath = `${config.staticDir}/${req.files.file.name}`;
    let moveError = await req.files.file.mv(outputFilepath);
    if (moveError) return res.status(500).send(moveError);
    resizeAndSave(config, req.files.file);
  }

  doc.save((saveError) => {
    if (saveError)
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: saveError });

    return res.json({
      message: 'success',
      result: doc.toJSON({ virtuals: true })
    });
  });

  // req.model.findOne({ _id: req.params._id }, '', {}, (err, doc) => {
  //   if (!doc)
  //     return res.status(httpStatus.NOT_FOUND).send('Not Found');
  //
  //   Object.keys(req.body).forEach(e => {
  //     doc[e] = req.body[e];
  //   });
  //
  //   let moveError = await req.files.file.mv(outputFilepath);
  //   if (moveError) return res.status(500).send(moveError);
  //   resizeAndSave(config, req.files.file);
  //
  //   doc.save((saveError) => {
  //     if (saveError)
  //       return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: saveError });
  //
  //     return res.json({
  //       message: 'success',
  //       result: doc.toJSON({ virtuals: true })
  //     });
  //   });
  // })
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
  resizeAndSave(config, req.files.file);

  req.model.create({
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

  // req.files.file.mv(outputFilepath, (err) => {
  //   if (err) return res.status(500).send(err);
  //
  //   // if (req.files.file.mimetype.split('/')[0] === 'image') {
  //   //   resizeAndSave(config, req.files.file);
  //   // }
  //
  //   req.model.create({
  //     name: req.body.name,
  //     caption: req.body.caption,
  //     description: req.body.description,
  //     filename: req.files.file.name
  //   }, (mediaCreateError, result) => {
  //     if (mediaCreateError)
  //       return res.status(500).json({ error: mediaCreateError });
  //
  //     return res.status(201)
  //       .json({
  //         id: result.id,
  //         name: result.name,
  //         description: result.description,
  //         filename: result.filename
  //       });
  //   });
  // })
}
