from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

import requests
import time
import random
import pandas as pd
import re


# -------------------- SETUP --------------------

options = Options()
options.add_argument("--start-maximized")
options.add_argument("--disable-blink-features=AutomationControlled")

driver = webdriver.Chrome(
    service=Service(ChromeDriverManager().install()),
    options=options
)


# -------------------- OPEN CITY --------------------

city_url = "https://www.spinny.com/used-cars-in-jaipur/s/"
driver.get(city_url)

time.sleep(8)


# -------------------- SCROLL --------------------

for _ in range(25):
    driver.execute_script("window.scrollBy(0, 2000);")
    time.sleep(random.uniform(2, 4))

print("✅ Scroll done")


# -------------------- GET LINKS --------------------

elements = driver.find_elements(By.TAG_NAME, "a")

links = []

for e in elements:
    link = e.get_attribute("href")

    if link and "/buy-used-cars/" in link:
        if link not in links:
            links.append(link)

driver.quit()
print("Total links:", len(links))


# -------------------- SCRAPE --------------------

car_data = []

for i, link in enumerate(links):

    print(f"Scraping {i+1}/{len(links)}")

    try:

        match = re.findall(r'/(\d+)/?$', link)

        if not match:
            continue

        car_id = match[0]

        api_url = f"https://www.spinny.com/api/product-detail/fetch-page-data/{car_id}/"

        res = requests.get(api_url)
        data = res.json()

        product = data.get("productDetail", {})

        specs = product.get("technicalSpecification", {}).get(
            "specification", {}
        ).get("specification_category", [])

        ratings = product.get("inspection_report_v3", {}).get(
            "category_list", []
        )

        variant = product.get("productDetail", {}).get("variant", {})

        features = product.get("features", {}).get(
            "features_category", []
        )

        # ---------- BASIC ----------

        make = product.get("make")
        model = (product.get("model") or "") + " " + (
            variant.get("display_name") or ""
        )

        makeYear = f"{product.get('make_month','')} {product.get('make_year','')}"
        registrationYear = f"{product.get('registration_month','')} {product.get('registration_year','')}"

        city = product.get("city")
        price = product.get("productPrice")
        fuelType = product.get("fuel_type")
        KmDriven = product.get("productMileage")
        transmission = product.get("transmission")
        noOfOwner = product.get("no_of_owners")
        bodyType = product.get("body_type")

        # ---------- FUNCTIONS ----------

        def get_spec(name):

            for cat in specs:
                for item in cat.get("values", []):

                    if item.get("display_name") == name:

                        v = item.get("value")
                        u = item.get("unit")

                        return f"{v} {u}" if u else v

            return None


        def get_feature(name):

            for cat in features:
                for item in cat.get("values", []):

                    if item.get("display_name") == name:
                        return item.get("value")

            return None


        # ---------- SPECS ----------

        groundClearance = get_spec("Ground clearance")
        bootSpace = get_spec("Boot space")
        numberOfSeatingRows = get_spec("Number of seating rows")
        wheelBase = get_spec("Wheelbase")
        length = get_spec("Length")
        FrontTyreSize = get_spec("Front tyre size")
        rearTyreSize = get_spec("Rear tyre size")
        numberofDoors = get_spec("Number of doors")
        Height = get_spec("Height")
        Widht = get_spec("Width")
        kerbWeight = get_spec("Kerb weight")

        gearBox = get_spec("Gear box")
        numberOfGears = get_spec("Number of gears")
        displacement = get_spec("Displacement")
        mileage = get_spec("Mileage (ARAI)")
        maxPower = get_spec("Max power (bhp)")
        maxTorque = get_spec("Max torque (Nm)")

        valveOrCylinders = get_spec("Valve/cylinder (configuration)")
        turboCharger = get_spec("Turbocharger")

        suspensionFrontType = get_spec("Suspension front type")
        suspentionRearType = get_spec("Suspension rear type")

        steeringAdjustmentType = get_spec("Steering adjustment type")
        steeringAdjustment = get_spec("Steering adjustment")

        frontBrakeType = get_spec("Front brake type")
        rearBrakeType = get_spec("Rear brake type")
        steeringType = get_spec("Steering type")

        alloyWheels = get_spec("Alloy wheels")

        # ---------- CYLINDERS / DRIVE ----------

        cylinders = None
        drive = None

        for category in specs:

            if category.get("display_name") == "Engine & transmission":

                for item in category.get("values", []):

                    if item.get("display_name") == "Number of cylinders":
                        cylinders = item.get("value")

                    if item.get("display_name") == "Drivetrain":
                        drive = item.get("value")

        # ---------- RATINGS ----------

        core = support = interior = exterior = wear = ""

        for r in ratings:

            if r["name"] == "Core systems":
                core = r["rating"]

            if r["name"] == "Supporting systems":
                support = r["rating"]

            if r["name"] == "Interiors & AC":
                interior = r["rating"]

            if r["name"] == "Exteriors & lights":
                exterior = r["rating"]

            if r["name"] == "Wear & tear parts":
                wear = r["rating"]

        # ---------- IMAGES ----------

        photos_data = product.get("product_photos", {})

        images_data = photos_data.get("images", {})

        exterior_photos = images_data.get("exterior", [])
        interior_photos = images_data.get("interior", [])

        def extract_urls(arr):

            urls = []

            for p in arr:

                url = p.get("file", {}).get("url")

                if url:

                    if url.startswith("//"):
                        url = "https:" + url

                    urls.append(url)

            return urls


        ext_urls = extract_urls(exterior_photos)
        int_urls = extract_urls(interior_photos)

        all_images_list = ext_urls + int_urls

        all_images = ",".join(all_images_list)

        # without bg

        without_bg_url = photos_data.get(
            "without_bg_image", {}
        ).get("file", {}).get("absurl")

        if without_bg_url and without_bg_url.startswith("//"):
            without_bg_url = "https:" + without_bg_url

        # thumbnails

        thumbs = photos_data.get("thumbnails", [])

        thumb_list = []

        for t in thumbs:

            url = t.get("file", {}).get("absurl")

            if url:

                if url.startswith("//"):
                    url = "https:" + url

                thumb_list.append(url)

        all_thumbs = ",".join(thumb_list)

        # ---------- APPEND ----------

        car_data.append([
            car_id,
            city,
            price,
            makeYear,
            registrationYear,
            make,
            model,
            fuelType,
            KmDriven,
            transmission,
            bodyType,
            noOfOwner,

            groundClearance,
            bootSpace,
            numberOfSeatingRows,
            wheelBase,
            length,
            FrontTyreSize,
            rearTyreSize,
            numberofDoors,
            Height,
            Widht,
            kerbWeight,

            gearBox,
            numberOfGears,
            displacement,
            mileage,
            maxPower,
            maxTorque,

            cylinders,
            drive,

            valveOrCylinders,
            turboCharger,
            suspensionFrontType,
            suspentionRearType,
            steeringAdjustmentType,
            steeringAdjustment,

            frontBrakeType,
            rearBrakeType,
            steeringType,

            alloyWheels,

            core,
            support,
            interior,
            exterior,
            wear,

            all_images,
            without_bg_url,
            all_thumbs
        ])

        time.sleep(1)

    except Exception as e:
        print("Error:", e)


# -------------------- SAVE CSV --------------------

columns = [
    "car_id","city","price","makeYear","registrationYear","make","model",
    "fuelType","KmDriven","transmission","bodyType","noOfOwner",

    "groundClearance","bootSpace","numberOfSeatingRows","wheelBase",
    "length","FrontTyreSize","rearTyreSize","numberofDoors",
    "Height","Widht","kerbWeight",

    "gearBox","numberOfGears","displacement","mileage",
    "maxPower","maxTorque",

    "cylinders","drive",

    "valveOrCylinders","turboCharger",
    "suspensionFrontType","suspentionRearType",
    "steeringAdjustmentType","steeringAdjustment",

    "frontBrakeType","rearBrakeType","steeringType",

    "alloyWheels",

    "core","support","interior","exterior","wear",

    "all_images",
    "without_bg_image",
    "thumbnails"
]

df = pd.DataFrame(car_data, columns=columns)

df.to_csv("spinny_fulls_data.csv", index=False)

print("✅ Saved spinny_full_data.csv")