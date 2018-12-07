import config from './Page.config';
import Page from './Page.model';
import httpStatus from 'http-status';
import toKebabCase from '../../src/lib/helpers/toKebabCase';

const pageController = {
  query(req, res) {
    Page.apiQuery(req.query, (err, pages) => {
      if (err) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({error: err});
      }
      return res.json(pages);
    });
  },

  find(req, res) {
    Page.findOne({ 'slug': req.params.slug }, (err, doc) => {
      if (err) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({error: err});
      }

      if (!doc) {
        return res.status(httpStatus.NOT_FOUND).send('Not Found');
      }

      return res.json(doc);
    });
  },

  post(req, res) {
    const page = {
      ...req.body,
      slug: toKebabCase(req.body[config.uid])
    }

    Page.create(page, (err, doc) => {
      if (err) {
        return res.send(httpStatus.INTERNAL_SERVER_ERROR, {error: err});
      }
      return res.json(doc);
    });
  },

  update(req, res) {
    Page.findOneAndUpdate({_id: req.params.id}, req.body, {new: true}, (err, doc) => {
      if (err) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({error: err});
      }

      if (!doc) {
        return res.status(httpStatus.NOT_FOUND).send('Not Found');
      }

      return res.json(doc);
    });
  },

  delete(req, res) {
    Page.findOneAndDelete({_id: req.params.id}, (err, doc) => {
      if (err) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({error: err});
      }

      if (!doc) {
        return res.status(httpStatus.NOT_FOUND).send('Not Found');
      }

      return res.send();
    });
  },
};

export default pageController;
