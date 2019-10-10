import httpStatus from 'http-status';

const upsert = (req, res) => {
  req.model.findOne({}, (err, doc) => {
    if (!doc) {
      req.model.create(req.body, (err, result) => {
        if (err)
          return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({error: err});

        return res.status(httpStatus.CREATED)
          .json({
            message: 'success',
            result: result.toJSON({virtuals: true})
          });
      });
    } else {
      Object.keys(req.body).forEach(e => {
        doc[e] = req.body[e];
      });
      doc.save((err) => {
        if (err)
          return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({error: err});

        return res.json({
          message: 'success',
          result: doc.toJSON({virtuals: true})
        });
      });
    }
  });
};

export default upsert;
