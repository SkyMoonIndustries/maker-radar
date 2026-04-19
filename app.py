from flask import Flask, request, jsonify, render_template
import requests
from bs4 import BeautifulSoup
import json
import os

app = Flask(__name__)

# --- AYARLAR VE SABİTLER ---
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7'
}

SITES = {
    "Robotistan": {
        "type": "html",
        "search_url": "https://www.robotistan.com/arama?q={}",
        "container": {"tag": "div", "class_": "product-item"}, 
        "name": {"tag": "a", "class_": "product-title"},
        "price": {"tag": "strong", "class_": "product-price"},
        "link_prefix": "https://www.robotistan.com"
    },
    "Direnc.net": {
        "type": "html",
        "search_url": "https://www.direnc.net/arama?q={}",
        "container": {"tag": "div", "class_": "productItem"},
        "name": {"tag": "a", "class_": "productDescription"},
        "price": {"tag": "span", "class_": "currentPrice"},
        "link_prefix": "https://www.direnc.net"
    },
    "Motorobit": {
        "type": "json",
        "search_url": "https://www.motorobit.com/arama?q={}",
        "link_prefix": "" 
    },
    "Robo90": {
    "type": "html",
    "search_url": "https://www.robo90.com/arama?q={}",
    "container": {"tag": "div", "class_": "productItem"}, 
    "name": {"tag": "a", "class_": "listProductName"},
    "price": {"tag": "div", "class_": "currentPrice"},
    "link_prefix": "https://www.robo90.com"
    },
    "robolinkmarket": {
    "type": "html",
    "search_url": "https://www.robolinkmarket.com/arama?q={}",
    "container": {"tag": "div", "class_": "product-item"}, 
    "name": {"tag": "div", "class_": "product-title"},
    "price": {"tag": "div", "class_": "yeni-fiyat"},
    "link_prefix": "https://www.robolinkmarket.com"
    }
}

def clean_turkish_price(price_text):
    try:
        clean_text = str(price_text).replace('TL', '').replace('₺', '').replace('$', '').replace('€', '')
        clean_text = clean_text.replace('.', '').replace(',', '.').strip()
        return float(clean_text)
    except:
        return 0.0

def scrape_site(site_name, query, config):
    url = config["search_url"].format(query.replace(" ", "+"))
    results = []
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        soup = BeautifulSoup(response.content, 'html.parser')
        
        if config.get("type") == "json":
            scripts = soup.find_all('script', type='application/ld+json')
            for script in scripts:
                if 'ItemList' in script.text:
                    data = json.loads(script.text)
                    for element in data.get('itemListElement', [])[:24]:
                        try:
                            item = element.get('item', {})
                            name = item.get('name', 'İsimsiz Ürün')
                            offers = item.get('offers', {})
                            
                            try: price = float(offers.get('price', 0))
                            except: price = 0.0
                                
                            link = offers.get('url', '')
                            
                            img_obj = item.get('image')
                            image_url = ""
                            if isinstance(img_obj, list) and len(img_obj) > 0: image_url = str(img_obj[0])
                            elif isinstance(img_obj, str): image_url = img_obj
                            elif isinstance(img_obj, dict): image_url = str(img_obj.get('url', ''))
                            
                            if price > 0:
                                results.append({'Görsel': image_url, 'Site': site_name, 'Ürün': name, 'Fiyat': price, 'Link': link})
                        except:
                            continue
                    return results
            return results

        elif config.get("type") == "html":
            if config["container"]["class_"]:
                products = soup.find_all(config["container"]["tag"], class_=config["container"]["class_"])
            else:
                products = soup.find_all(config["container"]["tag"])
                
            for item in products[:24]: 
                try:
                    # --- İSİM BULUCU ---
                    if config["name"]["class_"]: name_element = item.find(config["name"]["tag"], class_=config["name"]["class_"])
                    else: name_element = item.find(config["name"]["tag"])
                    if not name_element: continue
                    name = name_element.text.strip()
                    
                    # --- FİYAT BULUCU (Hiber ve İndirimsiz Ürünler İçin Geliştirildi) ---
                    price_element = None
                    if config["price"]["class_"]: 
                        price_element = item.find(config["price"]["tag"], class_=config["price"]["class_"])
                    
                    # Eğer spesifik fiyat etiketi bulunamazsa (Örn: Hiber'de price-new yoksa) genel price sınıflarına bak
                    if not price_element:
                        price_element = item.find(class_='price') or item.find(class_='currentPrice') or item.find(class_='yeni-fiyat') or item.find('p', class_='price')
                    
                    if not price_element: continue
                    price = clean_turkish_price(price_element.text) 
                    
                    # --- LİNK BULUCU ---
                    if item.name == 'a' and 'href' in item.attrs: raw_link = item['href']
                    elif name_element.name == 'a' and 'href' in name_element.attrs: raw_link = name_element['href']
                    else:
                        link_element = item.find('a', href=True)
                        if link_element: raw_link = link_element['href']
                        else: continue
                    link = config["link_prefix"] + raw_link if not raw_link.startswith("http") else raw_link

                    # --- ZORLU GÖRSEL AVCI MOTORU (Robolink ve diğerleri için) ---
                    image_url = ""
                    
                    # 1. Taktik: Modern <picture> ve <source srcset> etiketleri
                    picture_element = item.find('picture')
                    if picture_element:
                        source = picture_element.find('source')
                        if source and source.get('srcset'):
                            image_url = source.get('srcset').split(',')[0].strip().split(' ')[0]
                    
                    # 2. Taktik: Klasik <img> ve Lazy Load varyasyonları
                    if not image_url:
                        img_element = item.find('img')
                        if img_element:
                            image_url = img_element.get('data-src') or img_element.get('data-original') or img_element.get('data-lazy-src') or img_element.get('src') or ""
                    
                    if image_url.startswith("//"): image_url = "https:" + image_url
                    elif image_url.startswith("/") and not image_url.startswith("//"): image_url = config["link_prefix"] + image_url

                    if price > 0:
                        results.append({'Görsel': image_url, 'Site': site_name, 'Ürün': name, 'Fiyat': price, 'Link': link})
                except:
                    continue
    except:
        pass
    return results

# --- API ROTASI (ROUTES) ---

@app.route('/')
def home():
    # Frontend'i ekrana basar
    return render_template('index.html')

@app.route('/api/search', methods=['GET'])
def search_api():
    # JavaScript'ten gelen arama terimini alır
    query = request.args.get('q', '')
    if not query:
        return jsonify([])

    all_data = []
    for site_name, config in SITES.items():
        all_data.extend(scrape_site(site_name, query, config))
    
    # Fiyata göre sırala
    all_data = sorted(all_data, key=lambda x: x['Fiyat'])
    
    # Temiz bir JSON olarak Frontend'e fırlat!
    return jsonify(all_data)

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    # 0.0.0.0 yapmak, dış dünyadan gelen isteklere kapıyı açar
    app.run(host="0.0.0.0", port=port)