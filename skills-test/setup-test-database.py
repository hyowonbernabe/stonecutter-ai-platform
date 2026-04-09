"""
Stonecutter AI Platform Engineer — Skills Test Database Generator

Run this script to create a SQLite database with sample Amazon marketplace data.
The database simulates a brand management agency's data warehouse.

Usage: python3 setup-test-database.py
Output: data/sample.db
"""

import sqlite3
import random
import os
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "sample.db")

# Fictional brands and products (NOT real Stonecutter clients)
BRANDS = {
    "PureVita Supplements": {
        "category": "Health & Household",
        "products": [
            ("B0A1PUREVITA1", "PureVita Daily Multivitamin - 60 Capsules", 29.99),
            ("B0A1PUREVITA2", "PureVita Omega-3 Fish Oil - 90 Softgels", 24.99),
            ("B0A1PUREVITA3", "PureVita Probiotic 50 Billion CFU - 30 Capsules", 34.99),
            ("B0A1PUREVITA4", "PureVita Vitamin D3 5000 IU - 120 Softgels", 19.99),
            ("B0A1PUREVITA5", "PureVita Magnesium Glycinate 400mg - 60 Capsules", 22.99),
        ],
    },
    "GlowHaven Skincare": {
        "category": "Beauty & Personal Care",
        "products": [
            ("B0A2GLOWHAVN1", "GlowHaven Vitamin C Serum - 1 fl oz", 32.00),
            ("B0A2GLOWHAVN2", "GlowHaven Retinol Night Cream - 1.7 oz", 38.00),
            ("B0A2GLOWHAVN3", "GlowHaven Hyaluronic Acid Moisturizer - 2 oz", 28.00),
            ("B0A2GLOWHAVN4", "GlowHaven Gentle Foaming Cleanser - 6 oz", 18.00),
            ("B0A2GLOWHAVN5", "GlowHaven SPF 50 Daily Sunscreen - 1.7 oz", 26.00),
        ],
    },
    "TailWag Pet Wellness": {
        "category": "Pet Supplies",
        "products": [
            ("B0A3TAILWAG01", "TailWag Hip & Joint Soft Chews for Dogs - 90ct", 29.99),
            ("B0A3TAILWAG02", "TailWag Calming Treats for Dogs - 60ct", 24.99),
            ("B0A3TAILWAG03", "TailWag Probiotic Chews for Dogs - 90ct", 27.99),
            ("B0A3TAILWAG04", "TailWag Salmon Oil Pump for Dogs & Cats - 16oz", 19.99),
            ("B0A3TAILWAG05", "TailWag Multivitamin Chews for Dogs - 120ct", 32.99),
        ],
    },
}

# Campaign types
CAMPAIGN_TYPES = [
    "Sponsored Products - Brand",
    "Sponsored Products - Category",
    "Sponsored Products - Competitor",
    "Sponsored Brands - Headline",
    "Sponsored Display - Retargeting",
]


def create_tables(conn):
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS products (
            asin TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            brand TEXT NOT NULL,
            category TEXT NOT NULL,
            price REAL NOT NULL,
            rating REAL,
            review_count INTEGER,
            is_subscribe_save_eligible INTEGER DEFAULT 1,
            launch_date TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS daily_sales (
            date TEXT NOT NULL,
            asin TEXT NOT NULL,
            units_ordered INTEGER,
            revenue REAL,
            sessions INTEGER,
            page_views INTEGER,
            buy_box_percentage REAL,
            unit_session_percentage REAL,
            PRIMARY KEY (date, asin),
            FOREIGN KEY (asin) REFERENCES products(asin)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS advertising (
            date TEXT NOT NULL,
            asin TEXT NOT NULL,
            campaign_type TEXT NOT NULL,
            impressions INTEGER,
            clicks INTEGER,
            spend REAL,
            ad_sales REAL,
            ad_units INTEGER,
            PRIMARY KEY (date, asin, campaign_type),
            FOREIGN KEY (asin) REFERENCES products(asin)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS subscriptions (
            date TEXT NOT NULL,
            asin TEXT NOT NULL,
            active_subscribers INTEGER,
            new_subscribers INTEGER,
            cancelled_subscribers INTEGER,
            subscription_revenue REAL,
            subscription_units INTEGER,
            PRIMARY KEY (date, asin),
            FOREIGN KEY (asin) REFERENCES products(asin)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS customer_metrics (
            date TEXT NOT NULL,
            brand TEXT NOT NULL,
            new_customers INTEGER,
            returning_customers INTEGER,
            new_to_brand_orders INTEGER,
            repeat_orders INTEGER,
            PRIMARY KEY (date, brand)
        )
    """)

    conn.commit()


def seed_products(conn):
    cursor = conn.cursor()
    for brand_name, brand_data in BRANDS.items():
        for asin, title, price in brand_data["products"]:
            rating = round(random.uniform(3.8, 4.8), 1)
            reviews = random.randint(200, 8000)
            launch_months_ago = random.randint(6, 36)
            launch_date = (datetime.now() - timedelta(days=launch_months_ago * 30)).strftime("%Y-%m-%d")
            cursor.execute(
                "INSERT INTO products VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (asin, title, brand_name, brand_data["category"], price, rating, reviews, 1, launch_date),
            )
    conn.commit()


def seed_daily_sales(conn):
    cursor = conn.cursor()
    start_date = datetime(2025, 1, 1)
    end_date = datetime(2026, 2, 28)
    current = start_date

    while current <= end_date:
        date_str = current.strftime("%Y-%m-%d")
        day_of_week = current.weekday()
        # Weekend boost
        weekend_mult = 1.2 if day_of_week >= 5 else 1.0
        # Seasonal: Q4 holiday boost, January dip
        month = current.month
        seasonal_mult = 1.0
        if month in (11, 12):
            seasonal_mult = 1.4
        elif month == 1:
            seasonal_mult = 0.8
        elif month in (6, 7):  # Prime Day boost
            seasonal_mult = 1.15

        for brand_name, brand_data in BRANDS.items():
            # Brand-level baseline
            if "PureVita" in brand_name:
                base_units = 45
            elif "GlowHaven" in brand_name:
                base_units = 30
            else:
                base_units = 55

            for asin, title, price in brand_data["products"]:
                # Product variation
                product_mult = random.uniform(0.5, 1.8)
                units = max(1, int(base_units * product_mult * weekend_mult * seasonal_mult * random.uniform(0.7, 1.3)))
                revenue = round(units * price * random.uniform(0.92, 1.0), 2)  # Some discounting
                sessions = int(units / random.uniform(0.08, 0.18))  # 8-18% conversion
                page_views = int(sessions * random.uniform(1.2, 1.8))
                buy_box = round(random.uniform(0.85, 1.0) * 100, 1)
                conversion = round((units / sessions) * 100, 2) if sessions > 0 else 0

                # Simulate a buy box problem for one product
                if asin == "B0A2GLOWHAVN2" and current >= datetime(2025, 10, 1):
                    buy_box = round(random.uniform(0.55, 0.75) * 100, 1)
                    units = int(units * 0.6)
                    revenue = round(units * price * random.uniform(0.85, 0.95), 2)

                cursor.execute(
                    "INSERT INTO daily_sales VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    (date_str, asin, units, revenue, sessions, page_views, buy_box, conversion),
                )

        current += timedelta(days=1)
    conn.commit()


def seed_advertising(conn):
    cursor = conn.cursor()
    start_date = datetime(2025, 1, 1)
    end_date = datetime(2026, 2, 28)
    current = start_date

    while current <= end_date:
        date_str = current.strftime("%Y-%m-%d")

        for brand_name, brand_data in BRANDS.items():
            for asin, title, price in brand_data["products"]:
                # Not all products run all campaign types
                active_campaigns = random.sample(CAMPAIGN_TYPES, random.randint(2, 4))
                for campaign in active_campaigns:
                    impressions = random.randint(500, 15000)
                    ctr = random.uniform(0.002, 0.012)
                    clicks = max(1, int(impressions * ctr))
                    cpc = random.uniform(0.45, 2.50)
                    spend = round(clicks * cpc, 2)
                    roas = random.uniform(2.0, 8.0)
                    ad_sales = round(spend * roas, 2)
                    ad_units = max(1, int(ad_sales / price))

                    cursor.execute(
                        "INSERT INTO advertising VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                        (date_str, asin, campaign, impressions, clicks, spend, ad_sales, ad_units),
                    )

        current += timedelta(days=1)
    conn.commit()


def seed_subscriptions(conn):
    cursor = conn.cursor()
    start_date = datetime(2025, 1, 1)
    end_date = datetime(2026, 2, 28)
    current = start_date

    # Only supplement and pet brands have meaningful S&S
    sns_asins = {}
    for brand_name, brand_data in BRANDS.items():
        if "GlowHaven" in brand_name:
            continue  # Skincare has low S&S
        for asin, title, price in brand_data["products"]:
            sns_asins[asin] = {
                "base_subscribers": random.randint(150, 800),
                "price": price,
                "growth_rate": random.uniform(0.001, 0.005),
            }

    while current <= end_date:
        date_str = current.strftime("%Y-%m-%d")
        days_elapsed = (current - start_date).days

        for asin, config in sns_asins.items():
            active = int(config["base_subscribers"] * (1 + config["growth_rate"] * days_elapsed))
            new_subs = max(1, int(active * random.uniform(0.01, 0.04)))
            cancelled = max(0, int(active * random.uniform(0.005, 0.02)))
            sub_units = int(active * random.uniform(0.15, 0.25))  # Not all ship every day
            sub_revenue = round(sub_units * config["price"] * 0.85, 2)  # S&S discount

            # Simulate a churn spike for one product
            if asin == "B0A3TAILWAG02" and datetime(2025, 9, 1) <= current <= datetime(2025, 10, 15):
                cancelled = int(cancelled * 3.5)
                active = max(50, active - cancelled * 10)

            cursor.execute(
                "INSERT INTO subscriptions VALUES (?, ?, ?, ?, ?, ?, ?)",
                (date_str, asin, active, new_subs, cancelled, sub_revenue, sub_units),
            )

        current += timedelta(days=1)
    conn.commit()


def seed_customer_metrics(conn):
    cursor = conn.cursor()
    start_date = datetime(2025, 1, 1)
    end_date = datetime(2026, 2, 28)
    current = start_date

    while current <= end_date:
        date_str = current.strftime("%Y-%m-%d")

        for brand_name in BRANDS:
            if "PureVita" in brand_name:
                base_new = 35
                base_returning = 25
            elif "GlowHaven" in brand_name:
                base_new = 20
                base_returning = 15
            else:
                base_new = 40
                base_returning = 30

            new_customers = max(1, int(base_new * random.uniform(0.6, 1.5)))
            returning = max(1, int(base_returning * random.uniform(0.6, 1.5)))
            ntb_orders = int(new_customers * random.uniform(1.0, 1.3))
            repeat_orders = int(returning * random.uniform(1.2, 2.0))

            cursor.execute(
                "INSERT INTO customer_metrics VALUES (?, ?, ?, ?, ?, ?)",
                (date_str, brand_name, new_customers, returning, ntb_orders, repeat_orders),
            )

        current += timedelta(days=1)
    conn.commit()


def print_summary(conn):
    cursor = conn.cursor()
    print("\n=== Database Summary ===\n")

    tables = ["products", "daily_sales", "advertising", "subscriptions", "customer_metrics"]
    for table in tables:
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        count = cursor.fetchone()[0]
        print(f"  {table}: {count:,} rows")

    cursor.execute("SELECT DISTINCT brand FROM products")
    brands = [r[0] for r in cursor.fetchall()]
    print(f"\n  Brands: {', '.join(brands)}")

    cursor.execute("SELECT MIN(date), MAX(date) FROM daily_sales")
    min_date, max_date = cursor.fetchone()
    print(f"  Date range: {min_date} to {max_date}")

    print(f"\n  Database saved to: {DB_PATH}")
    print("  Ready for skills test!\n")


def main():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)

    conn = sqlite3.connect(DB_PATH)

    print("Creating tables...")
    create_tables(conn)

    print("Seeding products...")
    seed_products(conn)

    print("Seeding daily sales (14 months of data)...")
    seed_daily_sales(conn)

    print("Seeding advertising data...")
    seed_advertising(conn)

    print("Seeding subscription data...")
    seed_subscriptions(conn)

    print("Seeding customer metrics...")
    seed_customer_metrics(conn)

    print_summary(conn)
    conn.close()


if __name__ == "__main__":
    main()
