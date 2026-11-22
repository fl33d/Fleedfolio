-- Apply to the existing fleed-portfolios D1 database before deploying the code
-- that uses portfolio_slugs. No existing portfolio IDs or content are changed.
CREATE TABLE IF NOT EXISTS portfolio_slugs (
  slug TEXT NOT NULL PRIMARY KEY COLLATE NOCASE,
  portfolio_id TEXT NOT NULL UNIQUE REFERENCES portfolios(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_portfolio_slugs_portfolio
  ON portfolio_slugs(portfolio_id);
