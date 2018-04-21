class Collection {
  constructor(payload, key) {
    this.payload = payload;
    this.key = key;
    this.fields = {};
  }

  add(fields) {
    this.fields = fields;
  }

  register() {
    this.payload.collections[this.key] = this;
  }
}

module.exports = Collection;