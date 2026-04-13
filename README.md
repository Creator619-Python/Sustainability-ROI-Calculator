# 🌿 Sustainability ROI Calculator

A free, interactive web app that helps businesses calculate the financial return, payback period, NPV, and carbon impact of sustainability investments.

## Features
- 6 investment types (Solar, EV Fleet, Green Building, etc.)
- DCF-adjusted Enhanced ROI + Basic ROI
- Net Present Value (NPV) with configurable WACC and time horizon
- Payback period with interactive timeline chart
- **Cost of Inaction** analysis — shows the cost of NOT investing
- **PDF Export** via browser print
- Carbon tax savings and CO₂ impact
- Year-by-year breakdown table
- Multi-currency support (€, $, £, kr)
- Full offline support (PWA / Service Worker)

---

## 🚀 Deploy to GitHub Pages (Free)

### Step 1 — Create a GitHub repo
1. Go to https://github.com/new
2. Name it `sustainability-roi` (or anything you like)
3. Set it to **Public**, click Create

### Step 2 — Upload your files
Upload these files to the repo root:
- `index.html`
- `SustainabilityROI.jsx`
- `manifest.json`
- `service-worker.js`
- `/icons/` folder (add your app icons — see icon requirements below)

### Step 3 — Enable GitHub Pages
1. Go to repo **Settings → Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` / `root`
4. Click Save

Your app will be live at:
`https://YOUR-USERNAME.github.io/sustainability-roi`

---

## 🪟 Publish to Windows Store (Free)

### Step 1 — Make sure your app is live
Complete the GitHub Pages steps above first.

### Step 2 — Use PWABuilder
1. Go to https://www.pwabuilder.com
2. Enter your GitHub Pages URL
3. Click **Start** — PWABuilder will audit your PWA
4. Fix any warnings (icon sizes, HTTPS, manifest)
5. Click **Package for Store → Windows**
6. Download the `.msix` package

### Step 3 — Submit to Microsoft Store
1. Create a free developer account at https://partner.microsoft.com/dashboard
   - One-time fee: **$19 USD** for individual accounts
2. Go to **Windows → Overview → Create a new app**
3. Reserve your app name: e.g., "Sustainability ROI Calculator"
4. Upload the `.msix` file from PWABuilder
5. Fill in description, screenshots, category (Productivity / Finance)
6. Submit for review (~1–3 business days)

---

## 🖼 Icon Requirements

You need icons at these sizes (PNG, square):
`72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512`

Place them in an `/icons/` folder.

**Free icon generator:** https://www.pwabuilder.com/imageGenerator
Upload one 512x512 PNG and it generates all sizes automatically.

---

## 🏗 Production Build (Optional — better performance)

For a proper production build, use **Vite**:

```bash
npm create vite@latest sustainability-roi -- --template react
cd sustainability-roi
# Replace src/App.jsx with SustainabilityROI.jsx contents
# Add manifest.json to /public/
# Add service-worker.js to /public/
npm install
npm run build
# Upload /dist folder to GitHub Pages
```

---

## 📄 PDF Export

The app uses the browser's built-in print dialog.
- Click **"Export / Print as PDF"** in the Results tab
- Choose **"Save as PDF"** in the print dialog
- Works on Windows, Mac, Android, iOS

---

## 📋 Tech Stack
- React 18 (via CDN for zero-build-step deployment)
- Pure CSS animations
- No external dependencies beyond React
- Service Worker for offline support
- Web App Manifest for PWA / Windows Store packaging

---

## ⚠️ Disclaimer
All figures presented are estimates and approximations based on user inputs. They should not be considered guaranteed financial outcomes. Users should consult a qualified financial advisor before making investment decisions.

---

## 📃 License
Free to use, modify, and distribute. Attribution appreciated but not required.
