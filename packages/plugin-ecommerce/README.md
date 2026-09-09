# Payload Ecommerce

A set of utilities... more to come

## Stripe confirmation retries

Stripe confirmation is idempotent per ecommerce transaction: retries return the same order and public `transactionID`. Core atomically claims a pending transaction before creating the order, updating the cart, and decrementing inventory. No additional order field or data backfill is required. PostgreSQL users must generate and apply a schema migration that adds `processing` to the ecommerce transaction status enum; MongoDB and SQLite require no schema migration for this change.

Database adapters with transaction support roll back the complete settlement on failure. Without database transactions, concurrent requests are still serialized by the transaction status claim, but a process crash can leave a transaction in `processing`. This state fails closed and must be investigated; it is not reset automatically because the system cannot safely infer which side effects completed.
