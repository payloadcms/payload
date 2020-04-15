function registerTestingEndpoints() {
  this.router.post('/killkillkill', (req, res) => {
    console.log('Gracefully killing server...');
    res.json({ message: 'Shutting down server.' });
    process.exit(0);
  });
}

module.exports = registerTestingEndpoints;
