import express from 'express';
import passport from 'passport';
import mkdirp from 'mkdirp';

const router = new express.Router();

const classifyFile = (file) => {
  console.log(`File mimetype: ${file.mimetype}`);
  if (file.mimetype.split('/')[0] === 'image') {
    // TODO: Perform image specific operations
    console.log('File classified as an image.');
  }
};

const assetCtrl = {
  upload: (req, res) => {
    if (Object.keys(req.files).length === 0) {
      return res.status(400).send('No files were uploaded.');
    }

    mkdirp('./uploads', (err) => {
      if (err) console.error(err);
    });


    req.files.file.mv(`./uploads/${req.files.file.name}`, (err) => {
      if (err) return res.status(500).send(err);

      classifyFile(req.files.file);
      res.send('File uploaded.');
    })
  }
};

router
  .route('')
  .post(passport.authenticate('jwt', { session: false }), assetCtrl.upload);

export default router;
