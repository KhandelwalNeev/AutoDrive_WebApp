import streamlit as st
import pandas as pd
import numpy as np
import joblib
import gdown
import os

# model = joblib.load('car_price_model.pkl')


url = 'https://drive.google.com/file/d/1eVXFNmgA0usv5jUv0wkbxIAtJsQTwN0P/view?usp=sharing'

if not os.path.exists("car_model.pkl"):
    gdown.download(url, "car_model.pkl", quiet=False)

model = joblib.load("car_model.pkl")

# model = joblib.load(url)

df = joblib.load('cars_dataframe.pkl')

st.set_page_config(page_title = 'Used Cars Price Predictor')

st.header('Predict the price of your car')

region = st.selectbox('Region', sorted(df['region'].dropna().unique().tolist()))

manufacturer = st.selectbox(
    'Manufacturer',
    ['Select'] + sorted(df['manufacturer'].dropna().unique().tolist())
)

if manufacturer != 'Select':
    filtered_df = df[df['manufacturer'] == manufacturer]

    car_model = st.selectbox(
        'Car Model',
        sorted(filtered_df['model'].dropna().unique().tolist())
    )

    model_df = filtered_df[filtered_df['model'] == car_model]

else:
    filtered_df = df.copy()
    model_df = df.copy()
    car_model = None

if model_df.empty:
    st.warning("No data available for selected model")
    st.stop()

fuel_type = st.selectbox('Fuel Type', sorted(model_df['fuel'].dropna().unique()))

if fuel_type == 'electric':
    engine_cc = 0
    no_of_cylinders = 0
else:
    engine_cc = st.selectbox('Engine CC', sorted(model_df['engine_cc'].dropna().unique()))
    no_of_cylinders = st.selectbox('Cylinders', sorted(model_df['cylinders'].dropna().unique()))

max_power = st.selectbox('Max Power', sorted(model_df['max_power'].dropna().unique()))
transmission = st.selectbox('Transmission', sorted(model_df['transmission'].dropna().unique()))
body_type = st.selectbox('Body Type', sorted(model_df['type'].dropna().unique()))
drive_train = st.selectbox('Drive Train', sorted(model_df['drive'].dropna().unique()))
seats = st.selectbox('Seats', sorted(model_df['seats'].dropna().unique()))

km_driven = st.number_input("Enter km driven:", min_value=0, step=1000)
age = st.number_input("Enter age:", min_value=0, step=1)


def is_valid_combination(df, input_dict):
    check_cols = ['manufacturer', 'model', 'fuel', 'transmission']

    filtered = df.copy()

    for col in check_cols:
        filtered = filtered[filtered[col] == input_dict[col]]

    return not filtered.empty

if st.button('Predict Price'):

    input_data = {
        'region': region,
        'manufacturer': manufacturer,
        'model': car_model,
        'fuel': fuel_type,
        'engine_cc': engine_cc,
        'max_power': max_power,
        'cylinders': no_of_cylinders,
        'transmission': transmission,
        'type': body_type,
        'drive': drive_train,
        'seats': seats,
        'odometer': km_driven,
        'age': age
    }

    if not is_valid_combination(df, input_data):
        st.error("❌ Invalid combination!")
        st.stop()

    input_df = pd.DataFrame([input_data])

    prediction = model.predict(input_df)[0]

    mae = 94338

    lower = int(prediction - 0.75 * mae) / 100000
    upper = int(prediction + 0.75 * mae) / 100000

    price_lakh = prediction / 100000

    st.success(f"Estimated Price: ₹{price_lakh:.2f} Lakh")
    # st.success(f"Estimated Price: ₹{prediction:,}")
    st.success(f"Price Range: ₹{lower:.2f} Lakh – ₹{upper:.2f} Lakh")
    # st.success(f"💰 Predicted Price: ₹ {round(prediction):,}")