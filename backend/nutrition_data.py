# Nutrition facts per 100g for common foods (calories, protein_g, carbs_g, fat_g, fiber_g, sodium_mg)
# Sources: USDA FoodData Central, IFCT (Indian Food Composition Tables)

NUTRITION_DB: dict[str, dict] = {
    # ── Indian staples ──────────────────────────────────────────────────────────
    "white rice": {"calories": 130, "protein_g": 2.7, "carbs_g": 28.2, "fat_g": 0.3, "fiber_g": 0.4, "sodium_mg": 1, "serving_note": "cooked"},
    "brown rice": {"calories": 123, "protein_g": 2.6, "carbs_g": 25.6, "fat_g": 1.0, "fiber_g": 1.8, "sodium_mg": 1, "serving_note": "cooked"},
    "basmati rice": {"calories": 121, "protein_g": 2.5, "carbs_g": 25.2, "fat_g": 0.4, "fiber_g": 0.4, "sodium_mg": 1, "serving_note": "cooked"},
    "roti": {"calories": 264, "protein_g": 8.0, "carbs_g": 52.0, "fat_g": 3.7, "fiber_g": 2.7, "sodium_mg": 190, "serving_note": "per piece ~40g"},
    "chapati": {"calories": 264, "protein_g": 8.0, "carbs_g": 52.0, "fat_g": 3.7, "fiber_g": 2.7, "sodium_mg": 190, "serving_note": "per piece ~40g"},
    "naan": {"calories": 310, "protein_g": 9.5, "carbs_g": 55.0, "fat_g": 6.5, "fiber_g": 2.0, "sodium_mg": 480, "serving_note": "per piece ~90g"},
    "paratha": {"calories": 326, "protein_g": 7.0, "carbs_g": 46.0, "fat_g": 13.0, "fiber_g": 3.0, "sodium_mg": 250},
    "aloo paratha": {"calories": 260, "protein_g": 6.5, "carbs_g": 40.0, "fat_g": 9.0, "fiber_g": 3.5, "sodium_mg": 320},
    "poori": {"calories": 340, "protein_g": 7.0, "carbs_g": 44.0, "fat_g": 15.0, "fiber_g": 2.0, "sodium_mg": 220},
    "idli": {"calories": 58, "protein_g": 2.0, "carbs_g": 11.5, "fat_g": 0.4, "fiber_g": 0.5, "sodium_mg": 120, "serving_note": "per piece ~50g"},
    "dosa": {"calories": 168, "protein_g": 4.5, "carbs_g": 26.0, "fat_g": 5.5, "fiber_g": 1.2, "sodium_mg": 250, "serving_note": "plain"},
    "masala dosa": {"calories": 220, "protein_g": 5.0, "carbs_g": 30.0, "fat_g": 9.0, "fiber_g": 2.5, "sodium_mg": 400},
    "uttapam": {"calories": 180, "protein_g": 5.0, "carbs_g": 29.0, "fat_g": 5.0, "fiber_g": 1.5, "sodium_mg": 280},
    "upma": {"calories": 150, "protein_g": 4.0, "carbs_g": 25.0, "fat_g": 4.5, "fiber_g": 2.0, "sodium_mg": 350},
    "poha": {"calories": 130, "protein_g": 2.5, "carbs_g": 26.0, "fat_g": 2.5, "fiber_g": 1.0, "sodium_mg": 200},
    "biryani": {"calories": 175, "protein_g": 8.0, "carbs_g": 25.0, "fat_g": 5.0, "fiber_g": 1.0, "sodium_mg": 400},
    "chicken biryani": {"calories": 195, "protein_g": 12.0, "carbs_g": 25.0, "fat_g": 5.5, "fiber_g": 1.0, "sodium_mg": 450},
    "pulao": {"calories": 150, "protein_g": 4.0, "carbs_g": 27.0, "fat_g": 3.5, "fiber_g": 1.5, "sodium_mg": 300},
    "khichdi": {"calories": 120, "protein_g": 5.0, "carbs_g": 22.0, "fat_g": 2.0, "fiber_g": 3.0, "sodium_mg": 180},
    "sambar": {"calories": 50, "protein_g": 3.0, "carbs_g": 8.0, "fat_g": 1.0, "fiber_g": 2.5, "sodium_mg": 350},
    "rasam": {"calories": 30, "protein_g": 1.5, "carbs_g": 5.0, "fat_g": 0.5, "fiber_g": 1.0, "sodium_mg": 300},

    # ── Indian dals / legumes ───────────────────────────────────────────────────
    "dal tadka": {"calories": 100, "protein_g": 6.0, "carbs_g": 15.0, "fat_g": 2.5, "fiber_g": 4.0, "sodium_mg": 300},
    "dal makhani": {"calories": 135, "protein_g": 6.5, "carbs_g": 16.0, "fat_g": 5.0, "fiber_g": 4.5, "sodium_mg": 380},
    "chana masala": {"calories": 150, "protein_g": 8.0, "carbs_g": 20.0, "fat_g": 4.5, "fiber_g": 6.0, "sodium_mg": 420},
    "rajma": {"calories": 140, "protein_g": 9.0, "carbs_g": 20.0, "fat_g": 2.5, "fiber_g": 6.5, "sodium_mg": 350},
    "toor dal": {"calories": 116, "protein_g": 7.0, "carbs_g": 18.0, "fat_g": 1.0, "fiber_g": 5.0, "sodium_mg": 10, "serving_note": "cooked"},
    "moong dal": {"calories": 105, "protein_g": 7.0, "carbs_g": 16.0, "fat_g": 0.5, "fiber_g": 4.0, "sodium_mg": 10, "serving_note": "cooked"},
    "lentils": {"calories": 116, "protein_g": 9.0, "carbs_g": 20.0, "fat_g": 0.4, "fiber_g": 8.0, "sodium_mg": 2, "serving_note": "cooked"},
    "chickpeas": {"calories": 164, "protein_g": 8.9, "carbs_g": 27.4, "fat_g": 2.6, "fiber_g": 7.6, "sodium_mg": 24, "serving_note": "cooked"},

    # ── Indian curries / gravies ────────────────────────────────────────────────
    "butter chicken": {"calories": 165, "protein_g": 14.0, "carbs_g": 8.0, "fat_g": 9.0, "fiber_g": 1.0, "sodium_mg": 490},
    "chicken tikka masala": {"calories": 155, "protein_g": 13.0, "carbs_g": 7.0, "fat_g": 8.5, "fiber_g": 1.5, "sodium_mg": 510},
    "palak paneer": {"calories": 165, "protein_g": 8.0, "carbs_g": 6.0, "fat_g": 12.0, "fiber_g": 2.5, "sodium_mg": 380},
    "paneer butter masala": {"calories": 200, "protein_g": 9.0, "carbs_g": 8.0, "fat_g": 15.0, "fiber_g": 1.0, "sodium_mg": 450},
    "shahi paneer": {"calories": 210, "protein_g": 8.5, "carbs_g": 7.5, "fat_g": 16.0, "fiber_g": 1.0, "sodium_mg": 420},
    "aloo gobi": {"calories": 90, "protein_g": 3.0, "carbs_g": 14.0, "fat_g": 3.0, "fiber_g": 3.5, "sodium_mg": 280},
    "aloo matar": {"calories": 110, "protein_g": 4.0, "carbs_g": 17.0, "fat_g": 3.5, "fiber_g": 3.5, "sodium_mg": 310},
    "baingan bharta": {"calories": 80, "protein_g": 2.5, "carbs_g": 9.0, "fat_g": 4.0, "fiber_g": 4.0, "sodium_mg": 320},
    "saag": {"calories": 75, "protein_g": 3.5, "carbs_g": 8.0, "fat_g": 3.5, "fiber_g": 3.5, "sodium_mg": 300},
    "korma": {"calories": 180, "protein_g": 10.0, "carbs_g": 8.0, "fat_g": 12.0, "fiber_g": 1.5, "sodium_mg": 420},
    "vindaloo": {"calories": 160, "protein_g": 11.0, "carbs_g": 7.0, "fat_g": 10.0, "fiber_g": 1.0, "sodium_mg": 510},
    "fish curry": {"calories": 130, "protein_g": 14.0, "carbs_g": 5.0, "fat_g": 6.0, "fiber_g": 1.5, "sodium_mg": 450},
    "egg curry": {"calories": 145, "protein_g": 9.0, "carbs_g": 5.0, "fat_g": 9.5, "fiber_g": 1.5, "sodium_mg": 420},

    # ── Indian snacks & street food ─────────────────────────────────────────────
    "samosa": {"calories": 260, "protein_g": 4.5, "carbs_g": 30.0, "fat_g": 13.0, "fiber_g": 2.5, "sodium_mg": 350, "serving_note": "per piece ~80g"},
    "pakora": {"calories": 280, "protein_g": 6.0, "carbs_g": 28.0, "fat_g": 16.0, "fiber_g": 2.0, "sodium_mg": 400, "serving_note": "per 100g"},
    "vada": {"calories": 290, "protein_g": 7.0, "carbs_g": 30.0, "fat_g": 15.5, "fiber_g": 3.0, "sodium_mg": 380},
    "medu vada": {"calories": 290, "protein_g": 7.0, "carbs_g": 30.0, "fat_g": 15.5, "fiber_g": 3.0, "sodium_mg": 380},
    "pani puri": {"calories": 180, "protein_g": 3.5, "carbs_g": 30.0, "fat_g": 5.5, "fiber_g": 2.0, "sodium_mg": 400, "serving_note": "per serving ~6 pieces"},
    "bhel puri": {"calories": 120, "protein_g": 3.0, "carbs_g": 22.0, "fat_g": 3.0, "fiber_g": 2.5, "sodium_mg": 350},
    "pav bhaji": {"calories": 200, "protein_g": 5.5, "carbs_g": 32.0, "fat_g": 7.0, "fiber_g": 4.0, "sodium_mg": 500},
    "chole bhature": {"calories": 300, "protein_g": 10.0, "carbs_g": 45.0, "fat_g": 10.0, "fiber_g": 5.0, "sodium_mg": 550},
    "dhokla": {"calories": 160, "protein_g": 5.0, "carbs_g": 28.0, "fat_g": 3.5, "fiber_g": 1.5, "sodium_mg": 300},
    "kachori": {"calories": 350, "protein_g": 6.5, "carbs_g": 42.0, "fat_g": 17.0, "fiber_g": 3.0, "sodium_mg": 400},

    # ── Indian sweets & desserts ────────────────────────────────────────────────
    "gulab jamun": {"calories": 380, "protein_g": 5.0, "carbs_g": 55.0, "fat_g": 15.0, "fiber_g": 0.5, "sodium_mg": 160, "serving_note": "per piece ~50g"},
    "kheer": {"calories": 160, "protein_g": 4.5, "carbs_g": 26.0, "fat_g": 4.5, "fiber_g": 0.3, "sodium_mg": 70},
    "halwa": {"calories": 280, "protein_g": 4.0, "carbs_g": 42.0, "fat_g": 11.0, "fiber_g": 1.5, "sodium_mg": 120},
    "ladoo": {"calories": 410, "protein_g": 6.5, "carbs_g": 55.0, "fat_g": 18.0, "fiber_g": 2.5, "sodium_mg": 80, "serving_note": "per piece ~50g"},
    "jalebi": {"calories": 360, "protein_g": 2.0, "carbs_g": 72.0, "fat_g": 7.0, "fiber_g": 0.5, "sodium_mg": 20},
    "rasgulla": {"calories": 186, "protein_g": 4.5, "carbs_g": 37.0, "fat_g": 2.5, "fiber_g": 0, "sodium_mg": 40, "serving_note": "per piece ~60g"},
    "barfi": {"calories": 400, "protein_g": 8.0, "carbs_g": 55.0, "fat_g": 17.0, "fiber_g": 1.0, "sodium_mg": 60},
    "payasam": {"calories": 155, "protein_g": 4.0, "carbs_g": 25.0, "fat_g": 4.5, "fiber_g": 0.5, "sodium_mg": 60},

    # ── Indian beverages ────────────────────────────────────────────────────────
    "chai": {"calories": 50, "protein_g": 1.5, "carbs_g": 7.0, "fat_g": 1.5, "fiber_g": 0, "sodium_mg": 20, "serving_note": "per 150ml with milk and sugar"},
    "lassi": {"calories": 100, "protein_g": 4.5, "carbs_g": 14.0, "fat_g": 3.0, "fiber_g": 0, "sodium_mg": 80, "serving_note": "sweet, per 200ml"},
    "buttermilk": {"calories": 40, "protein_g": 3.0, "carbs_g": 5.0, "fat_g": 1.0, "fiber_g": 0, "sodium_mg": 250},
    "coconut water": {"calories": 19, "protein_g": 0.7, "carbs_g": 3.7, "fat_g": 0.2, "fiber_g": 1.1, "sodium_mg": 105},

    # ── Proteins ────────────────────────────────────────────────────────────────
    "chicken breast": {"calories": 165, "protein_g": 31.0, "carbs_g": 0, "fat_g": 3.6, "fiber_g": 0, "sodium_mg": 74, "serving_note": "cooked"},
    "chicken thigh": {"calories": 209, "protein_g": 26.0, "carbs_g": 0, "fat_g": 11.0, "fiber_g": 0, "sodium_mg": 88, "serving_note": "cooked"},
    "chicken leg": {"calories": 191, "protein_g": 22.0, "carbs_g": 0, "fat_g": 11.0, "fiber_g": 0, "sodium_mg": 85},
    "mutton": {"calories": 250, "protein_g": 25.6, "carbs_g": 0, "fat_g": 16.0, "fiber_g": 0, "sodium_mg": 72},
    "fish": {"calories": 128, "protein_g": 26.0, "carbs_g": 0, "fat_g": 2.5, "fiber_g": 0, "sodium_mg": 75},
    "salmon": {"calories": 208, "protein_g": 20.0, "carbs_g": 0, "fat_g": 13.0, "fiber_g": 0, "sodium_mg": 59},
    "tuna": {"calories": 132, "protein_g": 28.0, "carbs_g": 0, "fat_g": 1.2, "fiber_g": 0, "sodium_mg": 42},
    "egg": {"calories": 155, "protein_g": 13.0, "carbs_g": 1.1, "fat_g": 11.0, "fiber_g": 0, "sodium_mg": 124, "serving_note": "whole, raw"},
    "boiled egg": {"calories": 155, "protein_g": 13.0, "carbs_g": 1.1, "fat_g": 11.0, "fiber_g": 0, "sodium_mg": 124},
    "paneer": {"calories": 265, "protein_g": 18.0, "carbs_g": 3.6, "fat_g": 20.0, "fiber_g": 0, "sodium_mg": 30},
    "tofu": {"calories": 76, "protein_g": 8.0, "carbs_g": 1.9, "fat_g": 4.2, "fiber_g": 0.3, "sodium_mg": 7},

    # ── Dairy ───────────────────────────────────────────────────────────────────
    "milk": {"calories": 61, "protein_g": 3.2, "carbs_g": 4.8, "fat_g": 3.3, "fiber_g": 0, "sodium_mg": 43},
    "curd": {"calories": 98, "protein_g": 11.0, "carbs_g": 3.4, "fat_g": 4.3, "fiber_g": 0, "sodium_mg": 364},
    "yogurt": {"calories": 59, "protein_g": 10.0, "carbs_g": 3.6, "fat_g": 0.4, "fiber_g": 0, "sodium_mg": 36, "serving_note": "plain low-fat"},
    "ghee": {"calories": 900, "protein_g": 0, "carbs_g": 0, "fat_g": 100.0, "fiber_g": 0, "sodium_mg": 0},
    "butter": {"calories": 717, "protein_g": 0.9, "carbs_g": 0.1, "fat_g": 81.0, "fiber_g": 0, "sodium_mg": 576},
    "cheese": {"calories": 402, "protein_g": 25.0, "carbs_g": 1.3, "fat_g": 33.0, "fiber_g": 0, "sodium_mg": 621},

    # ── Vegetables ──────────────────────────────────────────────────────────────
    "spinach": {"calories": 23, "protein_g": 2.9, "carbs_g": 3.6, "fat_g": 0.4, "fiber_g": 2.2, "sodium_mg": 79},
    "tomato": {"calories": 18, "protein_g": 0.9, "carbs_g": 3.9, "fat_g": 0.2, "fiber_g": 1.2, "sodium_mg": 5},
    "onion": {"calories": 40, "protein_g": 1.1, "carbs_g": 9.3, "fat_g": 0.1, "fiber_g": 1.7, "sodium_mg": 4},
    "garlic": {"calories": 149, "protein_g": 6.4, "carbs_g": 33.1, "fat_g": 0.5, "fiber_g": 2.1, "sodium_mg": 17},
    "ginger": {"calories": 80, "protein_g": 1.8, "carbs_g": 18.0, "fat_g": 0.8, "fiber_g": 2.0, "sodium_mg": 13},
    "potato": {"calories": 77, "protein_g": 2.0, "carbs_g": 17.5, "fat_g": 0.1, "fiber_g": 2.2, "sodium_mg": 6},
    "sweet potato": {"calories": 86, "protein_g": 1.6, "carbs_g": 20.1, "fat_g": 0.1, "fiber_g": 3.0, "sodium_mg": 55},
    "carrot": {"calories": 41, "protein_g": 0.9, "carbs_g": 9.6, "fat_g": 0.2, "fiber_g": 2.8, "sodium_mg": 69},
    "broccoli": {"calories": 34, "protein_g": 2.8, "carbs_g": 7.0, "fat_g": 0.4, "fiber_g": 2.6, "sodium_mg": 33},
    "cauliflower": {"calories": 25, "protein_g": 1.9, "carbs_g": 5.3, "fat_g": 0.3, "fiber_g": 2.5, "sodium_mg": 30},
    "cabbage": {"calories": 25, "protein_g": 1.3, "carbs_g": 5.8, "fat_g": 0.1, "fiber_g": 2.5, "sodium_mg": 18},
    "cucumber": {"calories": 16, "protein_g": 0.7, "carbs_g": 3.6, "fat_g": 0.1, "fiber_g": 0.5, "sodium_mg": 2},
    "eggplant": {"calories": 25, "protein_g": 1.0, "carbs_g": 5.9, "fat_g": 0.2, "fiber_g": 3.0, "sodium_mg": 2},
    "green peas": {"calories": 81, "protein_g": 5.4, "carbs_g": 14.5, "fat_g": 0.4, "fiber_g": 5.1, "sodium_mg": 5},
    "capsicum": {"calories": 31, "protein_g": 1.0, "carbs_g": 6.0, "fat_g": 0.3, "fiber_g": 2.1, "sodium_mg": 4},
    "lady finger": {"calories": 33, "protein_g": 1.9, "carbs_g": 7.5, "fat_g": 0.2, "fiber_g": 3.2, "sodium_mg": 7},
    "okra": {"calories": 33, "protein_g": 1.9, "carbs_g": 7.5, "fat_g": 0.2, "fiber_g": 3.2, "sodium_mg": 7},
    "mushroom": {"calories": 22, "protein_g": 3.1, "carbs_g": 3.3, "fat_g": 0.3, "fiber_g": 1.0, "sodium_mg": 5},
    "corn": {"calories": 86, "protein_g": 3.2, "carbs_g": 18.7, "fat_g": 1.2, "fiber_g": 2.0, "sodium_mg": 15},

    # ── Fruits ──────────────────────────────────────────────────────────────────
    "apple": {"calories": 52, "protein_g": 0.3, "carbs_g": 14.0, "fat_g": 0.2, "fiber_g": 2.4, "sodium_mg": 1},
    "banana": {"calories": 89, "protein_g": 1.1, "carbs_g": 23.0, "fat_g": 0.3, "fiber_g": 2.6, "sodium_mg": 1},
    "mango": {"calories": 60, "protein_g": 0.8, "carbs_g": 15.0, "fat_g": 0.4, "fiber_g": 1.6, "sodium_mg": 1},
    "orange": {"calories": 47, "protein_g": 0.9, "carbs_g": 12.0, "fat_g": 0.1, "fiber_g": 2.4, "sodium_mg": 0},
    "grapes": {"calories": 67, "protein_g": 0.6, "carbs_g": 17.2, "fat_g": 0.4, "fiber_g": 0.9, "sodium_mg": 2},
    "watermelon": {"calories": 30, "protein_g": 0.6, "carbs_g": 7.6, "fat_g": 0.2, "fiber_g": 0.4, "sodium_mg": 1},
    "papaya": {"calories": 43, "protein_g": 0.5, "carbs_g": 11.0, "fat_g": 0.3, "fiber_g": 1.7, "sodium_mg": 8},
    "pineapple": {"calories": 50, "protein_g": 0.5, "carbs_g": 13.1, "fat_g": 0.1, "fiber_g": 1.4, "sodium_mg": 1},
    "guava": {"calories": 68, "protein_g": 2.6, "carbs_g": 14.3, "fat_g": 1.0, "fiber_g": 5.4, "sodium_mg": 2},
    "pomegranate": {"calories": 83, "protein_g": 1.7, "carbs_g": 18.7, "fat_g": 1.2, "fiber_g": 4.0, "sodium_mg": 3},

    # ── Nuts & seeds ────────────────────────────────────────────────────────────
    "almonds": {"calories": 579, "protein_g": 21.2, "carbs_g": 21.6, "fat_g": 49.9, "fiber_g": 12.5, "sodium_mg": 1},
    "cashews": {"calories": 553, "protein_g": 18.2, "carbs_g": 30.2, "fat_g": 43.8, "fiber_g": 3.3, "sodium_mg": 12},
    "peanuts": {"calories": 567, "protein_g": 25.8, "carbs_g": 16.1, "fat_g": 49.2, "fiber_g": 8.5, "sodium_mg": 18},
    "walnuts": {"calories": 654, "protein_g": 15.2, "carbs_g": 13.7, "fat_g": 65.2, "fiber_g": 6.7, "sodium_mg": 2},
    "chia seeds": {"calories": 486, "protein_g": 16.5, "carbs_g": 42.1, "fat_g": 30.7, "fiber_g": 34.4, "sodium_mg": 16},
    "flax seeds": {"calories": 534, "protein_g": 18.3, "carbs_g": 28.9, "fat_g": 42.2, "fiber_g": 27.3, "sodium_mg": 30},
    "sunflower seeds": {"calories": 584, "protein_g": 20.8, "carbs_g": 20.0, "fat_g": 51.5, "fiber_g": 8.6, "sodium_mg": 9},

    # ── Grains & cereals ────────────────────────────────────────────────────────
    "oats": {"calories": 389, "protein_g": 16.9, "carbs_g": 66.3, "fat_g": 6.9, "fiber_g": 10.6, "sodium_mg": 2},
    "oatmeal": {"calories": 71, "protein_g": 2.5, "carbs_g": 12.0, "fat_g": 1.5, "fiber_g": 1.7, "sodium_mg": 49, "serving_note": "cooked"},
    "wheat flour": {"calories": 340, "protein_g": 13.2, "carbs_g": 72.6, "fat_g": 1.8, "fiber_g": 2.7, "sodium_mg": 2},
    "whole wheat bread": {"calories": 247, "protein_g": 13.0, "carbs_g": 41.3, "fat_g": 4.2, "fiber_g": 6.0, "sodium_mg": 400},
    "white bread": {"calories": 265, "protein_g": 9.0, "carbs_g": 49.0, "fat_g": 3.2, "fiber_g": 2.7, "sodium_mg": 491},
    "pasta": {"calories": 158, "protein_g": 5.8, "carbs_g": 31.0, "fat_g": 0.9, "fiber_g": 1.8, "sodium_mg": 1, "serving_note": "cooked"},
    "noodles": {"calories": 138, "protein_g": 4.5, "carbs_g": 25.0, "fat_g": 2.0, "fiber_g": 1.0, "sodium_mg": 400, "serving_note": "cooked"},
    "semolina": {"calories": 360, "protein_g": 12.7, "carbs_g": 72.8, "fat_g": 1.1, "fiber_g": 3.9, "sodium_mg": 1},

    # ── Fast food & Western ─────────────────────────────────────────────────────
    "pizza": {"calories": 266, "protein_g": 11.0, "carbs_g": 33.0, "fat_g": 10.0, "fiber_g": 2.3, "sodium_mg": 598, "serving_note": "per slice"},
    "burger": {"calories": 295, "protein_g": 17.0, "carbs_g": 24.0, "fat_g": 14.0, "fiber_g": 1.0, "sodium_mg": 500},
    "french fries": {"calories": 312, "protein_g": 3.4, "carbs_g": 41.4, "fat_g": 15.0, "fiber_g": 3.8, "sodium_mg": 210},
    "fried chicken": {"calories": 320, "protein_g": 25.0, "carbs_g": 11.0, "fat_g": 19.0, "fiber_g": 0.5, "sodium_mg": 780},
    "sandwich": {"calories": 210, "protein_g": 10.0, "carbs_g": 28.0, "fat_g": 7.0, "fiber_g": 2.0, "sodium_mg": 580},
    "hot dog": {"calories": 290, "protein_g": 10.0, "carbs_g": 22.0, "fat_g": 18.0, "fiber_g": 1.0, "sodium_mg": 700},
    "donut": {"calories": 452, "protein_g": 4.9, "carbs_g": 51.0, "fat_g": 25.0, "fiber_g": 1.3, "sodium_mg": 326},
    "cake": {"calories": 347, "protein_g": 4.0, "carbs_g": 54.0, "fat_g": 13.0, "fiber_g": 0.6, "sodium_mg": 297},
    "ice cream": {"calories": 207, "protein_g": 3.5, "carbs_g": 24.0, "fat_g": 11.0, "fiber_g": 0.7, "sodium_mg": 80},

    # ── Beverages ───────────────────────────────────────────────────────────────
    "coffee": {"calories": 2, "protein_g": 0.3, "carbs_g": 0, "fat_g": 0, "fiber_g": 0, "sodium_mg": 2, "serving_note": "black, per 100ml"},
    "green tea": {"calories": 1, "protein_g": 0.2, "carbs_g": 0.2, "fat_g": 0, "fiber_g": 0, "sodium_mg": 1},
    "orange juice": {"calories": 45, "protein_g": 0.7, "carbs_g": 10.4, "fat_g": 0.2, "fiber_g": 0.2, "sodium_mg": 1},
    "coca cola": {"calories": 42, "protein_g": 0, "carbs_g": 10.6, "fat_g": 0, "fiber_g": 0, "sodium_mg": 10},
    "protein shake": {"calories": 120, "protein_g": 24.0, "carbs_g": 6.0, "fat_g": 1.5, "fiber_g": 1.0, "sodium_mg": 150},

    # ── Oils & condiments ───────────────────────────────────────────────────────
    "olive oil": {"calories": 884, "protein_g": 0, "carbs_g": 0, "fat_g": 100.0, "fiber_g": 0, "sodium_mg": 2},
    "coconut oil": {"calories": 862, "protein_g": 0, "carbs_g": 0, "fat_g": 100.0, "fiber_g": 0, "sodium_mg": 0},
    "mustard oil": {"calories": 884, "protein_g": 0, "carbs_g": 0, "fat_g": 100.0, "fiber_g": 0, "sodium_mg": 0},
    "soy sauce": {"calories": 53, "protein_g": 8.1, "carbs_g": 4.9, "fat_g": 0.6, "fiber_g": 0.8, "sodium_mg": 5765},
    "ketchup": {"calories": 112, "protein_g": 1.3, "carbs_g": 27.0, "fat_g": 0.5, "fiber_g": 0.3, "sodium_mg": 907},
    "mayonnaise": {"calories": 680, "protein_g": 1.0, "carbs_g": 0.6, "fat_g": 75.0, "fiber_g": 0, "sodium_mg": 635},
    "chutney": {"calories": 90, "protein_g": 1.5, "carbs_g": 18.0, "fat_g": 2.0, "fiber_g": 2.0, "sodium_mg": 350},
    "pickle": {"calories": 30, "protein_g": 1.0, "carbs_g": 5.0, "fat_g": 0.5, "fiber_g": 2.0, "sodium_mg": 1200},
}


def get_all_food_names() -> list[str]:
    return list(NUTRITION_DB.keys())


def get_nutrition(food_name: str) -> dict | None:
    key = food_name.lower().strip()
    return NUTRITION_DB.get(key)


def format_nutrition_context(food_name: str, grams: float = 100) -> str:
    data = get_nutrition(food_name)
    if not data:
        return f"No USDA data found for '{food_name}'."
    scale = grams / 100
    lines = [
        f"USDA Nutrition for {food_name} ({grams}g):",
        f"  Calories:  {round(data['calories'] * scale)} kcal",
        f"  Protein:   {round(data['protein_g'] * scale, 1)}g",
        f"  Carbs:     {round(data['carbs_g'] * scale, 1)}g",
        f"  Fat:       {round(data['fat_g'] * scale, 1)}g",
        f"  Fiber:     {round(data['fiber_g'] * scale, 1)}g",
        f"  Sodium:    {round(data['sodium_mg'] * scale)}mg",
    ]
    if "serving_note" in data:
        lines.append(f"  Note: {data['serving_note']}")
    return "\n".join(lines)
