-- Separate a request that may have reached ZarinPal from a request not yet sent.
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'REQUESTING';
