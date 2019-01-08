import express from 'express';
import passport from 'passport';

const router = new express.Router();

const assetCtrl = {
  upload: (req, res) => {
    if (Object.keys(req.files).length === 0) {
      return res.status(400).send('No files were uploaded.');
    }

    console.log(JSON.stringify(req));

    for (let file of req.files) {
      // TODO: Classify file
      file.mv('/static/test/asdf.jpg', (err) => {
        if (err)
          return res.status(500).send(err);
        res.send('File uploaded.');
      })
    }
  }
};

router
  .route('')
  .post(passport.authenticate('jwt', { session: false }), assetCtrl.upload);

export default router;
