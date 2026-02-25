![Python](https://img.shields.io/badge/Python-3.x-blue?logo=python)
![Flask](https://img.shields.io/badge/Flask-2.0+-green?logo=flask)
![License](https://img.shields.io/badge/License-MIT-yellow)
![Kids](https://img.shields.io/badge/Age-6--12-pink)
![Game](https://img.shields.io/badge/Type-Educational%20Game-purple)

# ⚡ Math Battle Arena – AI Anime Edition

> A colorful, animated math competition game for primary school children (age 6–12).  
> Built with **Python Flask** + **Vanilla HTML/CSS/JS**. Zero paid APIs. Zero database required.

---

## 🎮 Live Demo

> Deploy free on [PythonAnywhere](https://www.pythonanywhere.com) — see setup guide below.

---

## ✨ Features

| Feature | Details |
|---------|---------|
| 🤖 AI Anime Companions | Aria 🧙‍♀️, Kai 🦊, Luna 🌸, Blaze 🐉 — react to answers |
| ⚔️ Team Battle Mode | Blue vs Red, alternate turns |
| 🪢 Tug of War Mode | Animated rope — 5 pulls = win! |
| ⚡ Speed Round Mode | 60-second blitz |
| 📚 Practice Mode | Solo, with hints |
| 🔊 Sound Effects | Web Audio API — no MP3 files needed |
| 🗣️ Text-to-Speech | Browser-native speech for character messages |
| 🎉 Confetti Celebration | Canvas-based winner animation |
| 🏆 Leaderboard | In-memory Hall of Champions |
| 🤖 Auto Difficulty | AI adjusts question difficulty based on performance |
| 📱 Mobile Responsive | Works on phones and tablets |

---

## 🚀 Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/Prudhvi5121/math-battle-Prudhvi.git
cd math-battle-Prudhvi

# 2. Install Flask
pip install flask

# 3. Run
python app.py

# 4. Open in browser
# http://localhost:5000
```

Click **⚡ Quick Play** to start immediately, or use the 4-step setup to customize.

---

## 📁 Project Structure

```
math-battle-arena/
├── app.py                 ← Flask backend + question generator + API routes
├── requirements.txt       ← Just: flask>=2.0.0
├── README.md
├── templates/
│   ├── index.html         ← Setup screen (loading, character, mode, names, difficulty)
│   ├── game.html          ← Battle arena (scoreboard, timer, anime character, answers)
│   └── winner.html        ← Celebration screen (confetti, TTS, scores)
└── static/
    ├── style.css          ← Global shared styles
    └── script.js          ← Full game engine (~700 lines)
```

---

## 🎯 Game Rules

| Event | Points |
|-------|--------|
| ✅ Correct Answer | **+10** |
| ❌ Wrong Answer | **−5** |
| ⏰ Timeout | **0** |

- ⏱️ **10 seconds** per question  
- 🪢 **Tug of War**: first to **5 correct pulls** wins  
- ⚡ **Speed Round**: most points in **60 seconds** wins  

---

## 🎭 Difficulty Levels

| Level | Math | Range |
|-------|------|-------|
| 😊 Easy | + and − | 1–20 |
| 😎 Medium | × multiplication | 2–12 |
| 🔥 Hard | ÷ division | 2–120 |
| 🤖 Auto AI | Adapts dynamically | — |

---


---

## 🛠️ Tech Stack

- **Backend**: Python 3 + Flask
- **Frontend**: HTML5 + CSS3 + Vanilla JavaScript
- **Audio**: Web Audio API (synthesized, no files)
- **TTS**: Web Speech API (browser built-in)
- **Fonts**: Google Fonts (Bangers, Boogaloo, Nunito)
- **No database, no paid APIs, no npm**

---

## 📸 Screenshots

> *Game Screen — Team Battle Mode with Anime Character Aria*  
> *Tug of War — animated rope moves with each correct answer*  
> *Winner Screen — confetti explosion + TTS celebration*

---

## 📄 License

MIT License — free to use, modify, and share.

---

## 🏫 Made For

School competition demo · Primary education · Age 6–12  
*Made with ❤️ for kids who love math and anime!*