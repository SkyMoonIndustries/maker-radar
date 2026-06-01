# Maker-Radar 📡🛒

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge)](https://maker-radar.onrender.com/)

Maker-Radar is a production-ready, live-deployed e-commerce aggregator and price optimization engine specifically tailored for the electronics, robotics, and maker ecosystem in Turkey. 

It eliminates the friction of manual component procurement by allowing hardware developers to search, compare, and optimize component shopping lists across multiple major vendors from a single unified interface.

## 🧠 The Problem & Core Value Proposition
Hardware prototyping requires sourcing dozens of distinct components (microcontrollers, sensors, passives). In fragmented markets, developers waste hours navigating multiple websites to check stock, compare prices, and manually calculate the most cost-effective combination considering shifting shipping fees.

**Maker-Radar solves this via:**
* **Unified Search Index:** Instantly queries multiple vendor catalogs simultaneously.
* **Combinatorial Cart Optimization:** Calculates the absolute total cost (Items Price + Vendor-Specific Shipping Fees) site-by-site, helping users avoid paying multiple redundant shipping costs.
* **Data Portability:** Allows users to export their optimized component matrices directly into standard Excel format for institutional procurement or BOM (Bill of Materials) archiving.

## 🚀 Key Features

* **Real-Time Data Aggregation:** Dynamically parses and processes component structures from target platforms.
* **Multi-Vendor Multi-Cart Calculation:** Tracks entire component manifests and maps out total costs per vendor individually, dynamically factoring in shipping thresholds.
* **BOM Export Engine:** Generates clean, structured `.xlsx` datasheets containing links, prices, and quantities for rapid external ordering.
* **Live Deployment:** Production build is continuously integrated and deployed on Render cloud infrastructure.

## 📦 Supported Ecosystem Ecosystem
The platform currently indexes and aggregates major national robotics and component vendors:
* Robotistan
* Direnç.net
* Robo90
* Motorobit
* Robolink Market

## ⚖️ Ethical Scraping & Fair Use Policy
Maker-Radar is designed as a productivity utility that acts as a bridge between developers and component suppliers. The data gathering architecture adheres to strict ethical standards:
* **Zero Caching Manipulation:** Vendor pricing models, product descriptions, and stock statuses are represented exactly as they are on the native platforms.
* **Traffic Referral:** The tool functions as an organic lead generator, directing high-intent developer traffic straight to the respective vendor checkout pages.
* **Polite Rate Limiting:** Requests are structurally optimized to ensure absolutely zero unnecessary server load or performance overhead on target vendor infrastructures.

## ⚙️ Tech Stack
* **Backend/Frontend:** (Kullandığın teknolojiyi buraya yaz, örn: Python/Flask, Node.js/Express or Python/Django)
* **Web Scraping & Parsing:** (Örn: BeautifulSoup4, Playwright or Scrapy)
* **Data Export:** (Örn: Pandas, OpenPyXL or ExcelJS)
* **Hosting:** Render Cloud Platform

---
*Developed to keep the engineering flow state uninterrupted by tedious component shopping.*
