from app import db
from datetime import datetime

class Sales(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey('customer.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    
    def __repr__(self):
        return f'<Sales {self.id}: {self.total_amount}>'

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    price = db.Column(db.Float, nullable=False)
    cost = db.Column(db.Float, nullable=False)
    
    # Relationship
    sales = db.relationship('Sales', backref='product', lazy=True)
    
    def __repr__(self):
        return f'<Product {self.name}>'

class Customer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), nullable=True)
    location = db.Column(db.String(100), nullable=False)
    segment = db.Column(db.String(50), nullable=False)  # e.g., 'Enterprise', 'SMB', 'Consumer'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    sales = db.relationship('Sales', backref='customer', lazy=True)
    
    def __repr__(self):
        return f'<Customer {self.name}>'

class QueryHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    voice_query = db.Column(db.Text, nullable=False)
    generated_sql = db.Column(db.Text, nullable=False)
    explanation = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<QueryHistory {self.id}: {self.voice_query[:30]}...>'
