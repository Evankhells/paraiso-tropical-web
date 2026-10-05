from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("Paraiso Tropical") \
    .getOrCreate()

df = spark.read.csv("/data/ventas.csv", header=True, inferSchema=True)

print("\nPRODUCTOS MÁS VENDIDOS\n")

df.orderBy(df.Ventas.desc()).show()

spark.stop()