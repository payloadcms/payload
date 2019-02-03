import Post from './Post.model';
import httpStatus from 'http-status';

const destroy = (req, res) => {
  // Do something unique to deleting this model
  Post.findOneAndDelete({_id: req.params.id}, (err, doc) => {
    if (err)
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({error: err});

    if (!doc)
      return res.status(httpStatus.NOT_FOUND).send('Not Found');

    return res.send();
  });
};

export {destroy};
