-- SQL script to initialize analytics data for the SimpleSet dashboards
-- This script creates the monthly_data table and populates it with sample data
-- Usage: psql -U postgres -d postgres -f init-analytics-data.sql

-- Drop the table if it exists (for clean re-initialization)
DROP TABLE IF EXISTS monthly_data;

-- Create the monthly_data table
CREATE TABLE monthly_data (
    id SERIAL PRIMARY KEY,
    year INTEGER NOT NULL,
    month VARCHAR(20) NOT NULL,
    sales NUMERIC(10, 2) NOT NULL,
    revenue NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create an index for faster queries
CREATE INDEX idx_monthly_data_year_month ON monthly_data(year, month);

-- Insert sample data for 2024
-- This data will be used by the Analytics Dashboard, Sales Dashboard, 
-- Operations Dashboard, and Financial Dashboard

INSERT INTO monthly_data (year, month, sales, revenue) VALUES
    -- Q1 2024
    (2024, 'January', 45000.00, 125000.00),
    (2024, 'February', 52000.00, 138000.00),
    (2024, 'March', 58000.00, 152000.00),
    
    -- Q2 2024
    (2024, 'April', 61000.00, 165000.00),
    (2024, 'May', 68000.00, 178000.00),
    (2024, 'June', 72000.00, 192000.00),
    
    -- Q3 2024
    (2024, 'July', 75000.00, 205000.00),
    (2024, 'August', 82000.00, 218000.00),
    (2024, 'September', 88000.00, 235000.00),
    
    -- Q4 2024
    (2024, 'October', 95000.00, 248000.00),
    (2024, 'November', 102000.00, 265000.00),
    (2024, 'December', 110000.00, 285000.00);

-- Insert some data for 2023 for comparison (optional)
INSERT INTO monthly_data (year, month, sales, revenue) VALUES
    (2023, 'January', 38000.00, 105000.00),
    (2023, 'February', 42000.00, 115000.00),
    (2023, 'March', 48000.00, 128000.00),
    (2023, 'April', 51000.00, 138000.00),
    (2023, 'May', 55000.00, 148000.00),
    (2023, 'June', 60000.00, 160000.00),
    (2023, 'July', 63000.00, 172000.00),
    (2023, 'August', 68000.00, 182000.00),
    (2023, 'September', 72000.00, 195000.00),
    (2023, 'October', 78000.00, 208000.00),
    (2023, 'November', 85000.00, 222000.00),
    (2023, 'December', 92000.00, 238000.00);

-- Verify the data was inserted
SELECT 
    year,
    COUNT(*) as month_count,
    SUM(sales) as total_sales,
    SUM(revenue) as total_revenue,
    AVG(sales) as avg_sales,
    AVG(revenue) as avg_revenue
FROM monthly_data
GROUP BY year
ORDER BY year DESC;

-- Show a sample of the data
SELECT * FROM monthly_data WHERE year = 2024 ORDER BY id LIMIT 5;

-- Success message
\echo 'Analytics data initialized successfully!'
\echo 'Table: monthly_data'
\echo 'Records inserted for 2023 and 2024'

