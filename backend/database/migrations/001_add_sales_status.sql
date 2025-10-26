-- Add status column to sales table
-- Status can be: pending, completed, failed, refunded

ALTER TABLE sales
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'completed' NOT NULL;

-- Add constraint for valid status values
ALTER TABLE sales
ADD CONSTRAINT sales_status_check
CHECK (status IN ('pending', 'completed', 'failed', 'refunded'));

-- Add index for efficient status queries
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);

-- Add comment
COMMENT ON COLUMN sales.status IS 'Sale transaction status: pending, completed, failed, refunded';
