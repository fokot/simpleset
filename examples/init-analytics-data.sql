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

-- Insert some data for 2023 for comparison (with up-and-down pattern)
INSERT INTO monthly_data (year, month, sales, revenue) VALUES
    (2023, 'January', 55000.00, 145000.00),
    (2023, 'February', 62000.00, 165000.00),
    (2023, 'March', 70000.00, 185000.00),
    (2023, 'April', 58000.00, 155000.00),
    (2023, 'May', 48000.00, 130000.00),
    (2023, 'June', 42000.00, 115000.00),
    (2023, 'July', 52000.00, 140000.00),
    (2023, 'August', 65000.00, 175000.00),
    (2023, 'September', 78000.00, 205000.00),
    (2023, 'October', 68000.00, 180000.00),
    (2023, 'November', 55000.00, 150000.00),
    (2023, 'December', 72000.00, 190000.00);

-- Insert data for 2004
INSERT INTO monthly_data (year, month, sales, revenue) VALUES
    (2004, 'January', 22000.00, 68000.00),
    (2004, 'February', 24000.00, 72000.00),
    (2004, 'March', 26000.00, 78000.00),
    (2004, 'April', 28000.00, 82000.00),
    (2004, 'May', 30000.00, 88000.00),
    (2004, 'June', 32000.00, 92000.00),
    (2004, 'July', 33000.00, 95000.00),
    (2004, 'August', 35000.00, 98000.00),
    (2004, 'September', 36000.00, 102000.00),
    (2004, 'October', 38000.00, 108000.00),
    (2004, 'November', 40000.00, 115000.00),
    (2004, 'December', 42000.00, 122000.00);

-- Insert data for 2003
INSERT INTO monthly_data (year, month, sales, revenue) VALUES
    (2003, 'January', 18000.00, 55000.00),
    (2003, 'February', 19000.00, 58000.00),
    (2003, 'March', 20000.00, 62000.00),
    (2003, 'April', 21000.00, 65000.00),
    (2003, 'May', 22000.00, 68000.00),
    (2003, 'June', 24000.00, 72000.00),
    (2003, 'July', 25000.00, 75000.00),
    (2003, 'August', 26000.00, 78000.00),
    (2003, 'September', 27000.00, 82000.00),
    (2003, 'October', 29000.00, 88000.00),
    (2003, 'November', 31000.00, 92000.00),
    (2003, 'December', 33000.00, 98000.00);

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

