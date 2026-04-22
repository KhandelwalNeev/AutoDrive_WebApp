import streamlit as st
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import plotly.express as px
import seaborn as sns
import joblib
from scipy.ndimage import rotate
from wordcloud import WordCloud
from collections import Counter
import re
import gdown
import os


df = joblib.load("cleaned_cars_merges.pkl")
# df = pd.read_csv('cleaned_cars_merges.csv')


def generate_wordcloud(df, column_name, title):
    # 1. Combine text
    text = ' '.join(df[column_name].fillna('').astype(str)).lower()

    # 2. Remove special characters
    text = re.sub(r"[^\w\s]", "", text)

    # 3. Standardize phrases
    replacements = {
        "air conditioner": "air_conditioner",
        "power steering": "power_steering",
        "seat belt": "seat_belt",
        "central locking": "central_locking",
        "engine immobilizer": "engine_immobilizer",
        "child safety": "child_safety",
        "cup holders": "cup_holders",
        "keyless entry": "keyless_entry",
        "power windows": "power_windows",
        "rear ac vents": "rear_ac_vents",
        "air bag": "airbag",
        "airbags": "airbag",
        "anti theft": "anti_theft",
        "impact beams": "impact_beams",
        "door lock": "door_lock"
    }

    for k, v in replacements.items():
        text = text.replace(k, v)

    # 4. Remove useless words (SAFE WAY)
    stopwords = [
        'rear', 'front', 'left', 'right', 'side',
        'passenger', 'driver', 'seat', 'head',
        'adjustable', 'mounted', 'mirror',
        'light', 'lights', 'device', 'warning'
    ]

    words = text.split()
    words = [w for w in words if w not in stopwords]
    text = ' '.join(words)

    # 5. Clean spaces
    text = re.sub(r'\s+', ' ', text).strip()

    # 6. Generate wordcloud
    wc = WordCloud(
        width=1000,
        height=500,
        background_color='white',
        max_words=40,
        colormap='viridis',
        collocations=False
    ).generate(text)

    # 7. Plot WordCloud
    fig1, ax = plt.subplots(figsize=(10, 5))
    ax.imshow(wc)
    ax.set_title(title)
    ax.axis('off')

    # 8. Top features bar chart
    word_counts = Counter(text.split())
    top = word_counts.most_common(10)

    top_df = pd.DataFrame(top, columns=['Feature', 'Count'])

    fig2, ax2 = plt.subplots(figsize=(8, 4))
    ax2.barh(top_df['Feature'], top_df['Count'])
    ax2.set_title(f"Top Features - {title}")

    return fig1, fig2

feature_column = st.selectbox(
    "Select Feature Type",
    ['interior_features', 'top_features', 'comfort_features', 'safety_features']
)

if st.button('Generate Cloud'):
    fig1, fig2 = generate_wordcloud(df, feature_column, "WordCloud")

    st.pyplot(fig1)
    st.pyplot(fig2)  # use this instead of plotly


# statewise avg price
st.title("State wise avg price")

df['price'] = df['price'].str.replace(',', '', regex=False).astype(float)
state_price = df.groupby('state')['price'].mean().reset_index()

state_mapping = {
    'delhi': 'Delhi',
    'new delhi': 'Delhi',
    'mh': 'Maharashtra',
    'maharashtra': 'Maharashtra',
    'up': 'Uttar Pradesh',
    'uttar pradesh': 'Uttar Pradesh',
    'karnataka': 'Karnataka',
    'tamil nadu': 'Tamil Nadu',
    'haryana': 'Haryana',
    'rajasthan': 'Rajasthan',
    'gujarat': 'Gujarat',
    'jammu & kashmir': 'Jammu and Kashmir',
    'jammu and kashmir': 'Jammu and Kashmir',
    'daman and diu': 'Daman and Diu',
    'daman & diu': 'Daman and Diu',
    'dadra and nagar haveli': 'Dadra and Nagar Haveli',
    'dadra & nagar haveli': 'Dadra and Nagar Haveli',
    'pondicherry': 'Puducherry',
    'odisha': 'Orissa',
    'uttarakhand': 'Uttaranchal',
    'telangana': 'Telangana'
}

df['state'] = df['state'].map(lambda x: state_mapping.get(x, x.title()))

geojson_url = "https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson"

state_price = df.groupby('state')['price'].mean().reset_index()

fig3 = px.choropleth(
    state_price,
    geojson=geojson_url,
    locations='state',
    featureidkey='properties.NAME_1',  # 🔥 FIXED
    color='price',
    color_continuous_scale='Viridis',
    title='Average Car Price by State'
)

fig3.update_traces(
    hovertemplate="<b>%{location}</b><br>Avg Price: ₹%{z:.0f}"
)
fig3.update_geos(fitbounds="locations", visible=False)

st.plotly_chart(fig3)

# avg price of brands by state

st.title("Avg Price of brands by state")

brand = st.selectbox('Select Brand', sorted(df['brand'].unique().tolist()))  # example

filtered_df = df[df['brand'] == brand]

state_price = filtered_df.groupby('state')['price'].mean().reset_index()

fig4 = px.choropleth(
    state_price,
    geojson=geojson_url,
    locations='state',
    featureidkey='properties.NAME_1',
    color='price',
    color_continuous_scale='Viridis',
    title=f'Average Price of {brand} Cars by State'
)
fig4.update_traces(
    hovertemplate="<b>%{location}</b><br>Avg Price: ₹%{z:.0f}"
)
fig4.update_geos(fitbounds="locations", visible=False)
st.plotly_chart(fig4)

