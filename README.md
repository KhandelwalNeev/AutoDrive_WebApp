# 🚗 AutoDrive — Full Stack Car Platform

AutoDrive is a **full-stack web application** designed to simplify the used car buying experience using **modern web technologies and machine learning**.

---

## 🎯 Features

* 🚘 Browse and explore used cars
* 🧪 Book test drives / reservations
* 🔮 Predict car prices using Machine Learning
* 📰 View automotive news (India & Global)
* 🔐 User authentication system (Login / Signup)

---

# ⚙️ COMPLETE PROJECT SETUP

---

## 🔹 1. Clone Repository

```bash
git clone https://github.com/KhandelwalNeev/AutoDrive_WebApp
cd project
```

---

# 🧠 BACKEND SETUP (Flask + PostgreSQL)

## 📌 Requirements

* Python 3.10+
* PostgreSQL installed and running

---

## 🔹 Step 1: Create Virtual Environment

```bash
python -m venv venv
```

Activate:

```bash
# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

---

## 🔹 Step 2: Install Dependencies

```bash
pip install -r requirements.txt
```

---

## 🔹 Step 3: Setup PostgreSQL Database

```sql
CREATE DATABASE carapp;
```

---

## 🔹 Step 4: Configure Environment Variables

Create a `.env` file:

```env
DATABASE_URL=postgresql://postgres:0000@localhost:5432/carapp
```

---

## 🔹 Step 5: Initialize Database Tables

```bash
python db_init.py
```

---

## 🔹 Step 6: Upload Car Data

```bash
python Upload.py
```

---

## 🔹 Step 7: Run Backend Server

```bash
python app.py
```

Backend runs at:

```
http://127.0.0.1:10000
```

---

# 🌐 FRONTEND SETUP (Next.js)

## 📌 Requirements

* Node.js 18+
* npm / yarn / pnpm

---

## 🔹 Step 1: Install Dependencies

```bash
npm install
```

---

## 🔹 Step 2: Configure API URL

Frontend is configured to use:

```
http://127.0.0.1:10000
```

👉 Ensure backend is running before starting frontend.

---

## 🔹 Step 3: Run Frontend

```bash
npm run dev
```

Frontend runs at:

```
http://localhost:3000
```

---

# ▶️ HOW TO RUN FULL PROJECT

### Step 1: Start Backend

```bash
python app.py
```

### Step 2: Start Frontend

```bash
npm run dev
```

---

# 🔗 IMPORTANT NOTES

* Backend must be running before frontend
* PostgreSQL must be running before backend
* `.env` file must be configured correctly
* ML model files must exist:

```
car_model.pkl
cars_dataframe.pkl
```

---

# ⚠️ COMMON ERRORS & FIXES

### ❌ Backend not connecting

✔ Check PostgreSQL is running
✔ Check DATABASE_URL

---

### ❌ Frontend API error

✔ Ensure backend is running on port 10000

---

### ❌ Prediction not working

✔ Ensure model files exist

---

# 🚀 READY TO USE

Once everything is running:

👉 Open browser:

```
http://localhost:3000
```

---

# 👨‍💻 Contributors

* **Neev Khandelwal** — Machine Learning Model & Price Prediction System
* **Akshat Saxena** — Backend Development (Flask + APIs + Database)
* **Ahmad** — Frontend Development & UI/UX Design

---

# ⭐ Acknowledgment

This project is built as a collaborative effort combining **full-stack development and machine learning** to solve real-world problems in the used car market.

---
