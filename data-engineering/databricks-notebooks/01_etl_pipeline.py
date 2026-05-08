"""PROPIQ AI — PySpark Data Engineering Pipeline (Databricks Notebook 01)"""
# Run in Azure Databricks. Cluster: Standard_DS3_v2, DBR 14.x (Spark 3.5)
from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from pyspark.sql.window import Window

spark = SparkSession.builder.appName("PropIQ_ETL").getOrCreate()

STORAGE_ACCOUNT = "propiqstorage"
RAW_PATH        = f"abfss://raw@{STORAGE_ACCOUNT}.dfs.core.windows.net/"
STAGED_PATH     = f"abfss://staged@{STORAGE_ACCOUNT}.dfs.core.windows.net/"
CURATED_PATH    = f"abfss://curated@{STORAGE_ACCOUNT}.dfs.core.windows.net/"

# ── Stage 1: Read Raw Data ────────────────────────────────────────────────────
print("Stage 1: Reading raw data...")
raw_df = spark.read.option("multiLine", "true").json(RAW_PATH + "properties/")
print(f"Raw records: {raw_df.count()}")

# ── Stage 2: Cleansing ────────────────────────────────────────────────────────
print("Stage 2: Cleansing...")
clean_df = (
    raw_df
    .dropDuplicates(["property_id"])
    .filter(col("price") > 0)
    .filter(col("area_sqft") > 100)
    .filter(col("locality").isNotNull())
    .withColumn("price_per_sqft",
                when(col("price_per_sqft").isNotNull(), col("price_per_sqft"))
                .otherwise((col("price") / col("area_sqft")).cast("int")))
    .withColumn("locality_normalized", lower(trim(col("locality"))))
    .withColumn("city_normalized", lower(trim(col("city"))))
    .withColumn("price_crores", (col("price") / 10000000).cast("decimal(10,2)"))
)
print(f"Clean records: {clean_df.count()}")

# ── Stage 3: Feature Engineering ──────────────────────────────────────────────
print("Stage 3: Feature engineering...")
locality_window = Window.partitionBy("locality_normalized")

features_df = (
    clean_df
    .withColumn("age_bucket",
                when(col("age_years") < 5, "NEW")
                .when(col("age_years") < 15, "MID")
                .otherwise("OLD"))
    .withColumn("bhk_label",
                when(col("bhk") == 1, "1BHK")
                .when(col("bhk") == 2, "2BHK")
                .when(col("bhk") == 3, "3BHK")
                .otherwise("4BHK+"))
    .withColumn("locality_median_ppsf",
                percentile_approx("price_per_sqft", 0.5).over(locality_window))
    .withColumn("locality_listing_count",
                count("property_id").over(locality_window))
    .withColumn("price_vs_median_ratio",
                round(col("price_per_sqft") / col("locality_median_ppsf"), 3))
    .withColumn("is_premium_area",
                col("locality_normalized").isin(["banjara hills", "jubilee hills", "gachibowli", "madhapur", "hitec city"]))
    .withColumn("ingested_at", current_timestamp())
)

# ── Stage 4: Locality Price Index ─────────────────────────────────────────────
print("Stage 4: Building locality price index...")
locality_index = (
    features_df
    .withColumn("month", date_trunc("month", to_date("created_at")))
    .groupBy("locality_normalized", "city_normalized", "month")
    .agg(
        round(avg("price_per_sqft"), 0).cast("int").alias("avg_price_per_sqft"),
        percentile_approx("price", 0.5).cast("bigint").alias("median_price"),
        count("property_id").alias("listing_count"),
        round(stddev("price_per_sqft"), 0).cast("int").alias("price_stddev"),
        round(avg("age_years"), 1).alias("avg_age_years"),
    )
    .orderBy("locality_normalized", "month")
)

# ── Stage 5: Write Curated Delta Tables ──────────────────────────────────────
print("Stage 5: Writing to curated Delta tables...")
(
    features_df.write
    .format("delta")
    .mode("overwrite")
    .option("overwriteSchema", "true")
    .partitionBy("city_normalized")
    .save(CURATED_PATH + "properties_features/")
)

(
    locality_index.write
    .format("delta")
    .mode("overwrite")
    .option("overwriteSchema", "true")
    .partitionBy("city_normalized", "month")
    .save(CURATED_PATH + "locality_price_index/")
)

print("✅ ETL pipeline complete!")
print(f"  - properties_features: {features_df.count()} records")
print(f"  - locality_price_index: {locality_index.count()} records")
