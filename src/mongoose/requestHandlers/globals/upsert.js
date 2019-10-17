import httpStatus from 'http-status';

const upsert = (req, res) => {
  req.model.findOne({}, (err, doc) => {
    let global = {};
    if (!doc) {
      if (req.params.key) {
        global[req.params.key] = req.body;
      } else {
        global = req.body;
      }
      req.model.create(global, (err, result) => {
        if (err)
          return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({error: err});

        return res.status(httpStatus.CREATED)
          .json({
            message: 'success',
            result: result.toJSON({virtuals: true})
          });
      });
    } else {
      if (!req.model.schema.paths[req.params.key]) {
        return res.status(httpStatus.NOT_FOUND).json({error: 'not found'});
      }
      if (!doc[req.params.key]) {
        doc[req.params.key] = {};
      }
      Object.keys(req.body).forEach(e => {
        doc[req.params.key][e] = req.body[e];
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
