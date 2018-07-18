const express = require('express');
const path = require('path');
const http = require('http');

const app = express();

// Point static path to dist
app.use(express.static(path.join(__dirname, 'dist')));

app.get('/*', (req, res, next) => {
  const routePath = path.join(`${__dirname }/dist/` + 'index.html');
  res.sendFile(routePath);
});

/** Get port from environment and store in Express. */
const port = process.env.PORT || '8000';
app.set('port', port);

/** Create HTTP server. */
const server = http.createServer(app);

/** Listen on provided port, on all network interfaces. */
server.listen(port, () => {return console.log(`Server Running on port ${port}`)});

