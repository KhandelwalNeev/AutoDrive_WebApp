# 🚗 Used Car Price Prediction & Analytics Dashboard

Live Demo : https://usedcarpricepredictor-pz3h4jsx5x9ffkhwg34amd.streamlit.app/

A **Machine Learning-powered Streamlit web application** that predicts used car prices and provides analytical insights using real-world data.

---

## 🌐 Live Application

👉 https://usedcarpricepredictor-pz3h4jsx5x9ffkhwg34amd.streamlit.app/

**Note:**

* The model is dynamically loaded from external storage
* First load may take a few seconds

---

## 📌 Project Overview

This project focuses on building a **data-driven system** to estimate the price of used cars based on multiple features such as:

* Car age
* Kilometers driven
* Engine capacity
* Fuel type
* Transmission
* Brand
* Max Power
* Region

The application also includes an **interactive analytics dashboard** to explore trends in the used car market.

---

## 🎯 Key Features

### 🔮 Price Prediction

* Predicts used car prices using a trained **Random Forest model**
* Displays results in **Indian currency format (₹)**
* Provides a **price range** based on model error (MAE)

---

### 📊 Analytics Dashboard

* Price distribution analysis
* Feature-based insights (fuel, transmission, etc.)
* Visualizations using Plotly & Seaborn
* Wordclouds for features of cars(Top features, Interior features, Safety features, Comfort features)

---

### ⚡ Smart Enhancements

* Outlier removal using percentile-based filtering
* Feature engineering (`car_age`)
* Optimized model for deployment
* Handles unseen categories during prediction

---

## 🧠 Machine Learning Approach

* Model: **Random Forest Regressor**
* R² Score: **~0.92**
* MAE: **~₹94,000**

### Feature Selection Strategy:

* Domain knowledge
* Correlation analysis
* Feature importance

---

## 📁 Project Structure

```id="proj001"
📁 Used_Car_Price_Predictor/
│
├── app.py                          # Main Streamlit app
├── pages/                          # Multipage modules
│   ├── 1_Analytics.py
│   ├── 2_Price_Predictor.py
├── car_model.pkl
├── cars_dataframe.pkl
├── cleaned_cars_merges.pkl
├── requirements.txt                # Dependencies
├── README.md                       # Documentation
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone Repository

```bash id="cmd001"
git clone https://github.com/KhandelwalNeev/used_car_price_predictor.git
cd your-repo-name
```

---

### 2️⃣ Install Dependencies (IMPORTANT ⚠️)

```bash id="cmd002"
pip install -r requirements.txt
```

---

### 📦 Required Libraries (Strict Versions)

```text id="libs001"
scikit-learn==1.6.1
joblib==1.5.3
streamlit
pandas
numpy
matplotlib
seaborn
plotly
wordcloud
gdown
```

---

### 3️⃣ Run Application

```bash id="cmd003"
streamlit run app.py
```

---

## ☁️ Model Deployment Strategy

Due to GitHub file size limitations:

* The trained model is hosted externally (e.g., Google Drive)
* It is downloaded dynamically using `gdown`
* Ensures smooth deployment without reducing model performance

---

## ⚠️ Limitations

* Model performs best for **mid-range vehicles**
* Predictions for **luxury cars** may be less accurate
* Confidence score is **heuristic-based**, not statistical probability

---

## 🚀 Future Improvements

* Improve luxury car predictions
* Add real-time data integration
* Deploy via FastAPI + AWS
* Enhance UI/UX

---

## 🧠 Key Learnings

* Feature engineering plays a critical role
* Handling high-cardinality features
* Model optimization for deployment
* Real-world ML limitations

---

## 👨‍💻 Author

**Neev Khandelwal**
B.Tech CSE | Data Science Enthusiast

---

## ⭐ Acknowledgment

Thanks to open-source libraries and datasets that made this project possible.

---
