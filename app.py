"""
╔══════════════════════════════════════════════════════════╗
║   MATH BATTLE ARENA – AI ANIME EDITION                  ║
║   Flask Backend                                          ║
║                                                          ║
║   Run:  pip install flask                                ║
║         python app.py                                    ║
║   Open: http://localhost:5000                            ║
╚══════════════════════════════════════════════════════════╝
"""

from flask import Flask, render_template, request, jsonify, session
import random, time, math

app = Flask(__name__)
app.secret_key = "anime_math_arena_2024_secret"

# ─────────────────────────────────────────────────────────────────────────────
# In-memory leaderboard  (resets when server restarts – no DB needed)
# ─────────────────────────────────────────────────────────────────────────────
leaderboard = []

# ─────────────────────────────────────────────────────────────────────────────
# Question Generator
# ─────────────────────────────────────────────────────────────────────────────
def generate_question(difficulty="easy", performance=None):
    """
    Build a math question dict.
    difficulty: "easy" | "medium" | "hard" | "auto"
    performance: float 0-1 used when difficulty=="auto"
    Returns  { question, answer, difficulty, hint }
    """
    # Auto difficulty based on performance ratio
    if difficulty == "auto" and performance is not None:
        if   performance >= 0.80: difficulty = "hard"
        elif performance >= 0.55: difficulty = "medium"
        else:                     difficulty = "easy"
    elif difficulty == "auto":
        difficulty = "easy"

    if difficulty == "easy":
        op = random.choice(["+", "−"])
        a  = random.randint(1, 20)
        b  = random.randint(1, 20)
        if op == "−" and b > a:
            a, b = b, a
        answer = a + b if op == "+" else a - b
        hint   = f"Count on your fingers! {a} {op} {b}"

    elif difficulty == "medium":
        a      = random.randint(2, 12)
        b      = random.randint(2, 12)
        answer = a * b
        op     = "×"
        hint   = f"Think of {a} groups of {b}!"

    else:  # hard
        b      = random.randint(2, 10)
        answer = random.randint(2, 12)
        a      = b * answer
        op     = "÷"
        hint   = f"How many {b}s fit in {a}?"

    return {
        "question":   f"{a} {op} {b}",
        "answer":     answer,
        "difficulty": difficulty,
        "hint":       hint,
    }

# ─────────────────────────────────────────────────────────────────────────────
# Motivational messages for the anime character
# ─────────────────────────────────────────────────────────────────────────────
MESSAGES = {
    "correct":  ["Great job! ⭐", "You're a math wizard! 🧙", "Awesome! Keep going! 🔥",
                 "Incredible! ✨", "Nailed it! 💥", "You're on fire! 🌟"],
    "wrong":    ["Try again! 💪", "Don't give up! 🌈", "Almost! You got this! 😊",
                 "Keep trying! ⚡", "Mistakes help us learn! 📚"],
    "timeout":  ["Time's up! Be faster! ⏰", "Speed it up! ⚡", "Tick tock! ⏱️"],
    "thinking": ["Hmm, let me think... 🤔", "You can do it! 💭", "Focus! 🎯",
                 "Take a deep breath! 🌟", "I believe in you! 💖"],
    "win":      ["AMAZING! YOU WIN! 🏆", "CHAMPION! 👑", "LEGENDARY! 🌟",
                 "MATH MASTER! 🥇", "SUPERSTAR! ⭐"],
}

def pick_message(mood):
    return random.choice(MESSAGES.get(mood, ["Keep going! 💪"]))

# ─────────────────────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    """Loading / Welcome screen"""
    return render_template("index.html")

@app.route("/game")
def game():
    """Main game screen"""
    return render_template("game.html")

@app.route("/winner")
def winner():
    """Winner celebration screen"""
    return render_template("winner.html")

# ── API: new question ─────────────────────────────────────────────────────────
@app.route("/api/question", methods=["POST"])
def api_question():
    data        = request.get_json() or {}
    difficulty  = data.get("difficulty", "easy")
    performance = data.get("performance", None)
    q = generate_question(difficulty, performance)
    return jsonify(q)

# ── API: check answer ─────────────────────────────────────────────────────────
@app.route("/api/check", methods=["POST"])
def api_check():
    data    = request.get_json() or {}
    correct = False
    try:
        correct = int(data.get("answer")) == int(data.get("correct_answer"))
    except (TypeError, ValueError):
        pass
    mood = "correct" if correct else "wrong"
    return jsonify({"correct": correct, "message": pick_message(mood), "mood": mood})

# ── API: thinking message ─────────────────────────────────────────────────────
@app.route("/api/message", methods=["POST"])
def api_message():
    mood = request.get_json(force=True).get("mood", "thinking")
    return jsonify({"message": pick_message(mood), "mood": mood})

# ── API: leaderboard GET ──────────────────────────────────────────────────────
@app.route("/api/leaderboard", methods=["GET"])
def api_leaderboard_get():
    top = sorted(leaderboard, key=lambda x: x["score"], reverse=True)[:10]
    return jsonify(top)

# ── API: leaderboard POST ─────────────────────────────────────────────────────
@app.route("/api/leaderboard", methods=["POST"])
def api_leaderboard_post():
    data = request.get_json() or {}
    entry = {
        "winner":   data.get("winner",   "Unknown"),
        "score":    data.get("score",    0),
        "mode":     data.get("mode",     "classic"),
        "blue":     data.get("blue",     "Team Blue"),
        "red":      data.get("red",      "Team Red"),
        "date":     time.strftime("%d %b %Y"),
    }
    leaderboard.append(entry)
    return jsonify({"status": "ok", "message": pick_message("win")})

# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("\n🌟 MATH BATTLE ARENA – AI ANIME EDITION 🌟")
    print("📍  http://localhost:5000\n")
    app.run(debug=True, port=5000)
