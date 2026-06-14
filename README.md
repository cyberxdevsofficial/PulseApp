<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:4000ff,50:7c3aed,100:00d4ff&height=220&section=header&text=Sannasa%20Platform&fontSize=50&fontColor=ffffff&animation=fadeIn&fontAlignY=35&desc=⚡%20Powered%20by%20UDMODZ&descAlignY=55&descSize=18" width="100%"/>

<br/>

[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-Ready-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Firebase](https://img.shields.io/badge/Firebase-RTDB%20%2F%20Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com)

[![Version](https://img.shields.io/badge/Version-1.0.0-7c3aed?style=for-the-badge&logoColor=white)](https://github.com/udmodz0)
[![License](https://img.shields.io/badge/License-FREE-00d4ff?style=for-the-badge&logoColor=white)](https://github.com/udmodz0)
[![Status](https://img.shields.io/badge/Status-Active-00ff88?style=for-the-badge&logoColor=white)](https://github.com/udmodz0)
[![Website](https://img.shields.io/badge/Website-sannasa.udmodz.site-7c3aed?style=for-the-badge&logo=google-chrome&logoColor=white)](https://sannasa.udmodz.site)

<br/>

```
███████╗░█████╗░███╗░░██╗███╗░░██╗░█████╗░░██████╗░█████╗░
██╔════╝██╔══██╗████╗░██║████╗░██║██╔══██╗██╔════╝██╔══██╗
███████╗███████║██╔██╗██║██╔██╗██║███████║╚█████╗░███████║
╚════██║██╔══██║██║╚████║██║╚████║██╔══██║░╚═══██╗██╔══██║
███████║██║░░██║██║░╚███║██║░╚███║██║░░██║██████╔╝██║░░██║
╚══════╝╚═╝░░╚═╝╚═╝░░╚══╝╚═╝░░╚══╝╚═╝░░╚═╝╚═════╝░╚═╝░░╚═╝
```

</div>

---

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## <img src="https://media.giphy.com/media/iY8CRBdQXODJSCERIr/giphy.gif" width="30"> &nbsp;About

> **Sannasa** is a modern, serverless social media and real-time chat platform built for premium aesthetics and fluid interactions. Powered by a hybrid Cloudflare Workers and Firebase architecture, it features a glassmorphism design, real-time message sync, live presence tracking, audio/video call integration, and private storage backed by GitHub.
>
> Official website: **[sannasa.udmodz.site](https://sannasa.udmodz.site)**

<div align="center">

| 🧩 Feature | 📝 Description |
|:---:|:---|
| 💬 **Direct Messaging** | Fluid real-time chats with emoji reactions, media sharing, and stickers |
| 👥 **Groups & Channels** | Community interactions and broadcasting channels with followers |
| 📞 **Live Video Calls** | Integrated RTDB-driven audio and video calls |
| 🛡️ **Premium Admin Panel** | Live user verification, banning controls, and system-wide broadcasts |
| 🐙 **GitHub DB Storage** | Serverless image, voice, and media hosting directly via GitHub API |
| 🌌 **Glassmorphism UI** | Harmonious dark theme with micro-animations and custom wallpapers |

</div>

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## <img src="https://media.giphy.com/media/WUlplcMpOCEmTGBtBW/giphy.gif" width="30"> &nbsp;Architecture

```mermaid
graph TD
    A["🌐 Web App (React + Vite)"] -->|"Real-time Sync"| B["🔥 Firebase (Auth, Firestore, RTDB)"]
    A -->|"API Requests"| C["⚡ Cloudflare Workers"]
    A -->|"Upload Media"| D["🐙 GitHub Storage DB"]
    
    style A fill:#4000ff,color:#fff,stroke:#7c3aed
    style B fill:#FFCA28,color:#000,stroke:#FFA000
    style C fill:#F38020,color:#fff,stroke:#D9730D
    style D fill:#333,color:#fff,stroke:#666
```

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## ⚙️ Tech Stack

<div align="center">

<table>
<tr>
<td align="center" width="120">
<img src="https://skillicons.dev/icons?i=react" width="48" height="48" alt="React"/>
<br/><b>React</b>
<br/><sub>v18</sub>
</td>
<td align="center" width="120">
<img src="https://skillicons.dev/icons?i=vite" width="48" height="48" alt="Vite"/>
<br/><b>Vite</b>
<br/><sub>Bundler</sub>
</td>
<td align="center" width="120">
<img src="https://skillicons.dev/icons?i=firebase" width="48" height="48" alt="Firebase"/>
<br/><b>Firebase</b>
<br/><sub>Database & Auth</sub>
</td>
<td align="center" width="120">
<img src="https://skillicons.dev/icons?i=cloudflare" width="48" height="48" alt="Cloudflare"/>
<br/><b>Workers</b>
<br/><sub>Serverless API</sub>
</td>
</tr>
</table>

</div>

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## 🚀 Setup & Installation

<details>
<summary><b>💻 1. Local Setup</b></summary>
<br/>

```bash
# Clone the repository
git clone https://github.com/udmodz0/Sannasa.git
cd Sannasa

# Install dependencies
npm install

# Configure Environment variables
cp .env.example .env
# Set up your Firebase Config & Admin login credentials in .env

# Run local development server
npm run dev
```
</details>

<details>
<summary><b>🔥 2. Firebase Environment Setup</b></summary>
<br/>

Add the following environment variables to your `.env` file (which is automatically ignored by Git):
```ini
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_DATABASE_URL=your_database_url
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

VITE_ADMIN_USER=admin_username
VITE_ADMIN_PASS=admin_password
```
</details>

<details>
<summary><b>⚡ 3. Deploy to Cloudflare Workers</b></summary>
<br/>

```bash
# Build the production bundle
npm run build

# Deploy Cloudflare Workers backend
npm run worker:deploy
```
</details>

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## 📁 Project Structure

```
Sannasa/
├── 📁 public/             # 🎨 Assets & system logs
├── 📁 src/
│   ├── 📁 components/     # 🧩 ChatWindow, ChatList, Stickers, etc.
│   ├── 📁 context/        # 🔑 AuthState & Profile context
│   ├── 📁 hooks/          # 🧠 Custom presence & auth hooks
│   ├── 📁 pages/          # 📄 Home, Admin panel, Login, Signup
│   └── 📁 services/       # 🔌 Firebase backend configuration
├── 📁 worker/             # ⚡ Cloudflare Worker backend logic
├── 📄 wrangler.toml       # ⚙️ Cloudflare wrangler config
├── 📄 vite.config.js      # ⚡ Vite configuration
├── 📄 .env.example        # 📝 Template for environment keys
└── 📄 README.md           # 📖 You are here!
```

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

<div align="center">

## 👨‍💻 Creator

<a href="https://github.com/udmodz0">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=28&duration=2500&pause=800&color=7C3AED&center=true&vCenter=true&repeat=true&width=300&height=50&lines=UDMODZ" alt="UDMODZ" />
</a>

<br/>

<a href="https://github.com/udmodz0">
  <img src="https://img.shields.io/badge/GitHub-udmodz-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"/>
</a>

<br/><br/>

<img src="https://capsule-render.vercel.app/api?type=shark&color=0:4000ff,50:7c3aed,100:00d4ff&height=40&section=footer" width="100%"/>

### ⭐ Star this repo if you found it useful!

<br/>

> 🚫 **This is a FREE Project — Do NOT sell it.**
> 
> Made with 💜 by **UDMODZ**

<br/>

<img src="https://github-readme-activity-graph.vercel.app/graph?username=udmodz&theme=tokyo-night&hide_border=true&area=true&custom_title=UDMODZ%20Contribution%20Graph" width="95%"/>

<br/>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:4000ff,50:7c3aed,100:00d4ff&height=120&section=footer&animation=twinkling" width="100%"/>

</div>
