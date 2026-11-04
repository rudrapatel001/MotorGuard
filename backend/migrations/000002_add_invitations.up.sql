CREATE TABLE IF NOT EXISTS invitations (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'Engineer', 'Viewer')),
    token_hash VARCHAR(64) UNIQUE NOT NULL,
    invited_by INT REFERENCES users(id) ON DELETE SET NULL,
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
 
CREATE INDEX IF NOT EXISTS idx_invitations_customer ON invitations(customer_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(LOWER(email));