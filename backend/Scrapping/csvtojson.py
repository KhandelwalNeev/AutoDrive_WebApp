import pandas as pd

# read csv
csv_file = "All.csv"

df = pd.read_csv(csv_file)

# convert to json
json_file = "All.json"

df.to_json(json_file, orient="records", indent=4)

print("✅ Converted CSV to JSON")