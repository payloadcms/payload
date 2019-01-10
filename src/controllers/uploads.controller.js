import mkdirp from 'mkdirp';

const classifyFile = (file) => {
  console.log(`File mimetype: ${file.mimetype}`);
  if (file.mimetype.split('/')[0] === 'image') {
    // TODO: Perform image specific operations
    console.log('File classified as an image.');
  }
};

function upload(req, res) {
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

export default { upload };
