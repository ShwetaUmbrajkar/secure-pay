-- Demo seed data. Spring Boot runs this automatically on startup against
-- the JPA-managed schema (safe to re-run: guarded by ON CONFLICT).
INSERT INTO account (account_number, owner_name, balance)
VALUES ('ACC-001', 'Demo User', 50000.00)
ON CONFLICT (account_number) DO NOTHING;
