import Page from './Page.model';
import httpStatus from 'http-status';

const pageController = {
  query(req, res) {
    if (req.query.locale) {
      Page.setDefaultLanguage(req.query.locale);
    }
    Page.apiQuery(req.query, (err, pages) => {
      if (err) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err });
      }
      return res.json(pages.map(page => page.toJSON({ virtuals: !!req.locale })));
    });
  },

  find(req, res) {
    Page.findById(req.params.id, (err, doc) => {
      if (err) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err });
      }

      if (!doc) {
        return res.status(httpStatus.NOT_FOUND).send('Not Found');
      }

      if (req.locale) {
        doc.setLanguage(req.locale);
        return res.json(doc.toJSON({ virtuals: true }));
      }

      return res.json(doc);
    });
  },

  post(req, res) {
    Page.create(req.body, err => {
      if (err) {
        return res.send(httpStatus.INTERNAL_SERVER_ERROR, { error: err });
      }
      return res.json({
        message: 'Page created successfully'
      });
    });
  },

  update(req, res) {
    Page.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true }, (err, doc) => {
      if (err) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err });
      }

      if (!doc) {
        return res.status(httpStatus.NOT_FOUND).send('Not Found');
      }

      return res.json({
        message: 'Page updated successfully'
      });
    });
  },

  delete(req, res) {
    Page.findOneAndDelete({ _id: req.params.id }, (err, doc) => {
      if (err) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err });
      }

      if (!doc) {
        return res.status(httpStatus.NOT_FOUND).send('Not Found');
      }

      return res.send();
    });
  },
};

export default pageController;
