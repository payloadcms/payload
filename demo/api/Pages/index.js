import { Payload } from 'payload';

payload.get('/pages', (req, res) => {
  const filtered = payload.filter(req);
});
