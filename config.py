import os

# Gemini API configuration
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

# Database schema description for the AI agent
DB_SCHEMA_DESCRIPTION = """
This is a business intelligence database with the following tables:

1. Sales Table:
   - id: Integer, primary key
   - date: Date of the sale
   - product_id: Foreign key to Product table
   - customer_id: Foreign key to Customer table
   - quantity: Integer, number of items sold
   - total_amount: Float, total sale amount

2. Product Table:
   - id: Integer, primary key
   - name: String, product name
   - category: String, product category
   - price: Float, selling price per unit
   - cost: Float, cost per unit

3. Customer Table:
   - id: Integer, primary key
   - name: String, customer name
   - email: String, customer email
   - location: String, customer location/region
   - segment: String, customer segment (Enterprise, SMB, Consumer)
   - created_at: DateTime, customer registration date

Example business questions that can be answered:
- Monthly revenue and trends
- Top selling products
- Revenue by customer segment
- Profit margins by product category
- Sales growth in specific regions
"""

# Chart configuration
CHART_TYPES = {
    "BAR": "bar",
    "LINE": "line", 
    "PIE": "pie",
    "DOUGHNUT": "doughnut"
}

# Default chart settings
DEFAULT_CHART_COLORS = [
    "#4e79a7", "#f28e2c", "#e15759", "#76b7b2", 
    "#59a14f", "#edc949", "#af7aa1", "#ff9da7"
]
