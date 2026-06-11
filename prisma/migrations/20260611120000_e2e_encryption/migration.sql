-- E2E Encryption: add public_key to users, iv to messages

-- Each user uploads their ECDH P-256 public key after key generation on device
ALTER TABLE "users" ADD COLUMN "public_key" TEXT;

-- Per-message AES-GCM initialisation vector (12 bytes, base64).
-- NULL = legacy message stored as plaintext before this migration.
ALTER TABLE "messages" ADD COLUMN "iv" VARCHAR(24);
