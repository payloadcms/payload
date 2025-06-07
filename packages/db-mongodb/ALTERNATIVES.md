# Manual Join Mode Alternatives

While implementing manual join mode we considered that resolving joins in Node.js could add significant overhead. One possible alternative would be to implement a small proxy service that performs aggregation pipelines in a Mongo compatible environment and then forwards the result back to Firestore. This would keep join logic inside Mongo and avoid the need for complex client side resolution.
