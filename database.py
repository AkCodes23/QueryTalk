import logging
import datetime
from app import db
from models import Product, Customer, Sales

logger = logging.getLogger(__name__)

def initialize_sample_data():
    """Initialize the database with sample data if tables are empty"""
    # Check if data already exists
    if Product.query.first() is not None:
        logger.info("Sample data already exists in the database.")
        return
    
    logger.info("Initializing database with sample data...")
    
    try:
        # Create products
        products = [
            Product(name="Laptop Pro", category="Electronics", price=1299.99, cost=899.99),
            Product(name="Smartphone X", category="Electronics", price=799.99, cost=499.99),
            Product(name="Wireless Headphones", category="Electronics", price=149.99, cost=79.99),
            Product(name="Office Chair", category="Furniture", price=249.99, cost=129.99),
            Product(name="Standing Desk", category="Furniture", price=399.99, cost=199.99),
            Product(name="Coffee Machine", category="Appliances", price=89.99, cost=49.99),
            Product(name="Fitness Tracker", category="Wearables", price=129.99, cost=69.99),
            Product(name="Smart Speaker", category="Electronics", price=79.99, cost=39.99),
            Product(name="Tablet Mini", category="Electronics", price=399.99, cost=249.99),
            Product(name="External Hard Drive", category="Electronics", price=119.99, cost=59.99)
        ]
        
        db.session.add_all(products)
        db.session.flush()
        
        # Create customers
        customers = [
            Customer(name="Acme Corp", email="contact@acmecorp.com", location="New York", segment="Enterprise"),
            Customer(name="TechStart Inc", email="info@techstart.com", location="San Francisco", segment="SMB"),
            Customer(name="Global Solutions", email="sales@globalsolutions.com", location="Chicago", segment="Enterprise"),
            Customer(name="Digital Creations", email="hello@digitalcreations.com", location="Los Angeles", segment="SMB"),
            Customer(name="John Smith", email="john.smith@email.com", location="Denver", segment="Consumer"),
            Customer(name="Sarah Johnson", email="sarah.j@email.com", location="Miami", segment="Consumer"),
            Customer(name="Innovate LLC", email="info@innovatellc.com", location="Boston", segment="SMB"),
            Customer(name="Enterprise Systems", email="sales@enterprisesys.com", location="Seattle", segment="Enterprise"),
            Customer(name="Local Store", email="contact@localstore.com", location="Portland", segment="SMB"),
            Customer(name="Data Experts", email="info@dataexperts.com", location="Austin", segment="Enterprise")
        ]
        
        db.session.add_all(customers)
        db.session.flush()
        
        # Create sales data for the past year
        sales = []
        today = datetime.date.today()
        start_date = today - datetime.timedelta(days=365)
        
        # Generate sales for each month with seasonal variations
        for day_offset in range(365):
            current_date = start_date + datetime.timedelta(days=day_offset)
            
            # Determine number of sales for this day (more in Q4, fewer in Q1)
            month = current_date.month
            day_factor = 1.0
            
            if 10 <= month <= 12:  # Q4: Holiday season
                day_factor = 1.5
            elif 1 <= month <= 3:  # Q1: Post-holiday
                day_factor = 0.7
            elif 4 <= month <= 6:  # Q2: Spring
                day_factor = 1.0
            else:  # Q3: Summer
                day_factor = 1.2
                
            # Number of sales entries for this day
            num_sales = int(3 * day_factor)
            
            # Create sales entries
            for _ in range(num_sales):
                # Select random product and customer
                product_id = (day_offset % len(products)) + 1
                customer_id = ((day_offset + _) % len(customers)) + 1
                
                # Random quantity between 1 and 5
                quantity = ((day_offset + _ + product_id) % 5) + 1
                
                # Calculate total amount
                product = next((p for p in products if p.id == product_id), None)
                if product:
                    total_amount = product.price * quantity
                    
                    # Create sales record
                    sales.append(Sales(
                        date=current_date,
                        product_id=product_id,
                        customer_id=customer_id,
                        quantity=quantity,
                        total_amount=total_amount
                    ))
        
        db.session.add_all(sales)
        db.session.commit()
        
        logger.info(f"Sample data initialized - {len(products)} products, {len(customers)} customers, {len(sales)} sales records")
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error initializing sample data: {str(e)}")
        raise
