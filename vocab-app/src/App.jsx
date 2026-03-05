import { useState, useCallback, useMemo, useEffect } from "react";
import { OXFORD_WORDS } from './oxfordWords';
const WORDS = OXFORD_WORDS;
const FONT_STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --cream: #F8F4EE;
  --cream2: #EFE9DF;
  --teal: #1A6B6B;
  --teal-light: #2A8B8B;
  --teal-dim: #E8F4F4;
  --gold: #C8943A;
  --gold-light: #F5E6CC;
  --ink: #1C1C1C;
  --ink-soft: #555;
  --red: #C0392B;
  --red-light: #FDECEA;
  --green: #1A7A4A;
  --green-light: #E8F5EE;
  --shadow: 0 4px 24px rgba(0,0,0,0.08);
  --shadow-lg: 0 8px 40px rgba(0,0,0,0.13);
}

body { background: var(--cream); font-family: 'DM Sans', sans-serif; color: var(--ink); }

.lora { font-family: 'Lora', serif; }

.flip-card { perspective: 1200px; cursor: pointer; }
.flip-inner { position: relative; width: 100%; height: 100%; transition: transform 0.6s cubic-bezier(.4,0,.2,1); transform-style: preserve-3d; }
.flip-inner.flipped { transform: rotateY(180deg); }
.flip-face { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; border-radius: 20px; }
.flip-back { transform: rotateY(180deg); }

@keyframes fadeUp { from { opacity:0; transform:translateY(18px);} to { opacity:1; transform:translateY(0);} }
@keyframes pop { 0%{transform:scale(1)} 50%{transform:scale(1.12)} 100%{transform:scale(1)} }
@keyframes pulse-ring { 0%{box-shadow:0 0 0 0 rgba(26,107,107,0.35)} 70%{box-shadow:0 0 0 10px rgba(26,107,107,0)} 100%{box-shadow:0 0 0 0 rgba(26,107,107,0)} }
@keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }

.fade-up { animation: fadeUp 0.4s ease both; }
.pop { animation: pop 0.3s ease; }
.pulse-ring { animation: pulse-ring 0.8s ease; }
.shake { animation: shake 0.4s ease; }

.nav-btn { transition: all 0.2s; }
.nav-btn:hover { transform: translateY(-2px); }
.nav-btn.active { background: var(--teal) !important; color: white !important; }

.word-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }
.word-card { transition: all 0.2s; }

input:focus { outline: none; border-color: var(--teal) !important; box-shadow: 0 0 0 3px rgba(26,107,107,0.15); }

::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: var(--cream2); }
::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px; }
`;

const LEVELS = ["All", "A1", "A2", "B1", "B2", "C1"];
const TOPICS = ["All", "actions", "personal", "science", "quality", "success", "change", "feelings", "money", "communication", "history", "clarity", "movement", "planning", "analysis", "evaluation", "help", "environment", "appeal", "knowledge", "harmony", "obstacle", "advantage", "character", "ability", "difficulty", "features", "context", "dedication", "focus", "result", "persuasion", "importance", "harm", "choice", "commitment", "discovery", "growth"];

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";


function speak(word) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(word);
  u.lang = "en-US";
  u.rate = 0.85;
  window.speechSynthesis.speak(u);
}

function Badge({ level }) {
  const colors = { A1: "#1A7A4A", A2: "#2A8B8B", B1: "#C8943A", B2: "#8B4513", C1: "#6B1A6B" };
  return (
    <span style={{ background: colors[level] || "#888", color: "white", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, letterSpacing: 0.5 }}>
      {level}
    </span>
  );
}

function SpeakBtn({ word, size = 32 }) {
  const [playing, setPlaying] = useState(false);
  const handleClick = (e) => {
    e.stopPropagation();
    setPlaying(true);
    speak(word);
    setTimeout(() => setPlaying(false), 900);
  };
  return (
    <button onClick={handleClick} className={playing ? "pulse-ring" : ""} style={{
      width: size, height: size, borderRadius: "50%", border: "none",
      background: playing ? "var(--teal)" : "var(--teal-dim)",
      color: playing ? "white" : "var(--teal)",
      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.45, transition: "all 0.2s", flexShrink: 0
    }}>🔊</button>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
function Dashboard({ myWords, learnedWords, setScreen, user, goToReviewTab, dailyGoal, dailyStats, setDailyGoal, startSession }) {
  const [customAmount, setCustomAmount] = useState("");
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(dailyGoal);

  const handleGoalSave = () => {
    const val = parseInt(goalInput) || 10;
    setDailyGoal(val);
    setEditingGoal(false);
  };

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const wods = useMemo(() => {
    const t = new Date();
    const seed = t.getFullYear() * 10000 + (t.getMonth() + 1) * 100 + t.getDate();
    const list = [];
    for (let i = 0; i < 10; i++) {
      const index = (seed + i * 37) % WORDS.length;
      list.push(WORDS[index]);
    }
    return list;
  }, []);
  const [wodIndex, setWodIndex] = useState(0);
  const wod = wods[wodIndex];
  const learned = learnedWords.size;
  const total = WORDS.length;
  const pct = Math.round((learned / total) * 100);

  const cards = [
    { label: "Total Words", value: total, icon: "📚", color: "var(--teal)", onClick: () => setScreen("learn") },
    { label: "Mastered", value: learned, icon: "✅", color: "var(--green)", onClick: () => setScreen("mastered") },
    { label: "Studying", value: myWords.length - learned, icon: "📖", color: "var(--gold)", onClick: () => setScreen("studying") },
    { label: "Review Today", value: dailyStats.masteredIds ? dailyStats.masteredIds.length : 0, icon: "🔁", color: "#C0392B", onClick: () => goToReviewTab("today") },
  ];

  const menus = [
    { screen: "learn", icon: "📖", label: "Learn", sub: "Explore 500+ Oxford words", bg: "var(--teal)", shadow: "rgba(26,107,107,0.3)" },
    { screen: "studying", icon: "📚", label: "Studying", sub: "Words you are learning", bg: "var(--gold)", shadow: "rgba(200,148,58,0.3)" },
    { screen: "mastered", icon: "✅", label: "Mastered", sub: "Words you know well", bg: "var(--green)", shadow: "rgba(26,122,74,0.3)" },
    { screen: "review", icon: "🔁", label: "Review", sub: "Review daily progress", bg: "#C0392B", shadow: "rgba(192,57,43,0.3)" },
  ];

  return (
    <div className="fade-up" style={{ maxWidth: 700, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 4 }}>{today}</div>
        <h1 className="lora" style={{ fontSize: 32, fontWeight: 700, color: "var(--ink)", lineHeight: 1.2 }}>
          Hello {user.fullName || user.username}! 👋
        </h1>
        {user.dob && <p style={{ color: "var(--ink-soft)", fontSize: 13, marginTop: 4 }}>🎂 Born: {user.dob}</p>}
        <p style={{ color: "var(--ink-soft)", fontSize: 15, marginTop: 4 }}>What would you like to learn today?</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <button onClick={() => setScreen("learn")} style={{ background: "white", padding: 20, borderRadius: 16, border: "2px solid var(--cream2)", cursor: "pointer", textAlign: "left", transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.borderColor = "var(--teal)"} onMouseLeave={e => e.currentTarget.style.borderColor = "var(--cream2)"}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>📖</div>
          <div style={{ fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>Continue Learning</div>
          <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>Pick up where you left off</div>
        </button>

        <button onClick={() => setScreen("studying")} style={{ background: "var(--teal)", padding: 20, borderRadius: 16, border: "none", cursor: "pointer", textAlign: "left", color: "white", transition: "all 0.2s", boxShadow: "0 4px 12px rgba(45,188,140,0.3)" }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>⚡</div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Quick Review</div>
          <div style={{ fontSize: 13, opacity: 0.9 }}>{myWords.length - learnedWords.size} words waiting</div>
        </button>
      </div>



      <div style={{ marginTop: 32, background: "white", padding: 20, borderRadius: 16, border: "2px solid var(--cream2)" }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 12 }}>Bulk Add to Studying List</h3>
        <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 16 }}>Need words fast? Instantly add a set of random words to your saved flashcards.</p>
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <button onClick={() => window.handleBulkAdd(10)} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1px solid var(--cream2)", background: "var(--cream)", fontWeight: 600, cursor: "pointer" }}>+ 10 Words</button>
          <button onClick={() => window.handleBulkAdd(20)} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1px solid var(--cream2)", background: "var(--cream)", fontWeight: 600, cursor: "pointer" }}>+ 20 Words</button>
          <button onClick={() => window.handleBulkAdd(50)} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1px solid var(--cream2)", background: "var(--cream)", fontWeight: 600, cursor: "pointer" }}>+ 50 Words</button>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input type="number" min="1" max="100" placeholder="Custom amount" value={customAmount} onChange={e => setCustomAmount(e.target.value)} style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: "1px solid var(--cream2)", outline: "none", fontSize: 14 }} />
          <button onClick={() => { const val = parseInt(customAmount); if (val > 0) window.handleBulkAdd(val); setCustomAmount(""); }} style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: "var(--teal)", color: "white", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Add Words</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, marginBottom: 24 }}>
        {cards.map(c => (
          <div key={c.label} onClick={c.onClick} style={{ background: "white", borderRadius: 16, padding: "16px 18px", boxShadow: "var(--shadow)", display: "flex", alignItems: "center", gap: 12, cursor: c.onClick ? 'pointer' : 'default' }}>
            <div style={{ fontSize: 28 }}>{c.icon}</div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: c.color }}>{c.value}</div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div style={{ background: "white", borderRadius: 16, padding: "18px 20px", boxShadow: "var(--shadow)", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Overall Learning Progress</span>
          <span style={{ fontWeight: 700, color: "var(--teal)", fontSize: 15 }}>{pct}%</span>
        </div>
        <div style={{ background: "var(--cream2)", borderRadius: 99, height: 10, overflow: "hidden", marginBottom: 8 }}>
          <div style={{ width: `${pct}%`, background: "linear-gradient(90deg,var(--teal),var(--teal-light))", height: "100%", borderRadius: 99, transition: "width 1s ease" }} />
        </div>
        <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 8 }}>{learned} / {total} words mastered</div>
      </div>

      {/* Daily Goal */}
      <div style={{ background: "white", borderRadius: 16, padding: "18px 20px", boxShadow: "var(--shadow)", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Daily Goal: Master {dailyGoal} words</span>
          {!editingGoal ? (
            <button onClick={() => setEditingGoal(true)} style={{ background: "none", border: "none", color: "var(--teal)", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Edit</button>
          ) : (
            <div style={{ display: "flex", gap: 6 }}>
              <input type="number" min="1" max="100" value={goalInput} onChange={e => setGoalInput(e.target.value)} style={{ width: 60, padding: "4px 8px", borderRadius: 6, border: "1px solid var(--cream2)" }} />
              <button onClick={handleGoalSave} style={{ background: "var(--teal)", color: "white", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Save</button>
            </div>
          )}
        </div>
        <div style={{ background: "var(--cream2)", borderRadius: 99, height: 10, overflow: "hidden", marginBottom: 8 }}>
          <div style={{ width: `${Math.min(100, (dailyStats.progress / dailyGoal) * 100)}%`, background: "linear-gradient(90deg,var(--gold),var(--gold-light))", height: "100%", borderRadius: 99, transition: "width 1s ease" }} />
        </div>
        <div style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 500 }}>
          {dailyStats.progress >= dailyGoal ? "🎉 Goal reached for today!" : `${Math.max(0, dailyGoal - dailyStats.progress)} words left to master today`}
        </div>
      </div>

      {/* Word of Day */}
      <div style={{ background: "linear-gradient(135deg,var(--teal),var(--teal-light))", borderRadius: 20, padding: "20px 22px", marginBottom: 24, color: "white", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -20, right: -20, fontSize: 80, opacity: 0.1 }}>💡</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, opacity: 0.8 }}>WORD OF THE DAY</div>
          <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.8 }}>{wodIndex + 1} / 10</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span className="lora" style={{ fontSize: 26, fontWeight: 700 }}>{wod.word}</span>
          <SpeakBtn word={wod.word} size={30} />
        </div>
        <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 4 }}>{wod.phonetic} · {wod.pos}</div>
        <div style={{ fontSize: 15, fontWeight: 500 }}>{wod.vi}</div>
        <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4, fontStyle: "italic", minHeight: 40 }}>"{wod.ex}"</div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
          <button onClick={() => setWodIndex(i => i > 0 ? i - 1 : 9)} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontWeight: "bold" }}>←</button>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {wods.map((_, i) => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "white", opacity: i === wodIndex ? 1 : 0.3, transition: "opacity 0.2s" }} />
            ))}
          </div>
          <button onClick={() => setWodIndex(i => i < 9 ? i + 1 : 0)} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontWeight: "bold" }}>→</button>
        </div>
      </div>

      {/* Menu */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
        {menus.map(m => (
          <button key={m.screen} onClick={() => setScreen(m.screen)} style={{
            background: m.bg, color: "white", border: "none", borderRadius: 18,
            padding: "20px 16px", cursor: "pointer", textAlign: "left",
            boxShadow: `0 6px 24px ${m.shadow}`, transition: "all 0.2s"
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 10px 32px ${m.shadow}`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = `0 6px 24px ${m.shadow}`; }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{m.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{m.label}</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{m.sub}</div>
          </button>
        ))}
      </div>
    </div >
  );
}

// ─── LEARN ───────────────────────────────────────────────────────────────────
function Learn({ myWords, setMyWords, learnedWords, setLearnedWords }) {
  const [level, setLevel] = useState("All");
  const [topic, setTopic] = useState("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [addedPop, setAddedPop] = useState(null);

  const filtered = WORDS.filter(w =>
    (level === "All" || w.level === level) &&
    (topic === "All" || w.topic === topic) &&
    (w.word.includes(search.toLowerCase()) || w.vi.includes(search))
  );

  const addWord = (w) => {
    if (!myWords.find(x => x.id === w.id)) {
      setMyWords([...myWords, w], w);
    }
    setAddedPop(w.id);
    setTimeout(() => setAddedPop(null), 1200);
  };

  const toggleLearned = (id) => {
    const s = new Set(learnedWords);
    s.has(id) ? s.delete(id) : s.add(id);
    setLearnedWords(s);
  };

  return (
    <div className="fade-up" style={{ maxWidth: 700, margin: "0 auto", padding: "20px 16px" }}>
      <h2 className="lora" style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>📖 Learn New Words</h2>

      {/* Search */}
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search vocabulary..." style={{
        width: "100%", padding: "12px 16px", borderRadius: 12, border: "2px solid var(--cream2)",
        background: "white", fontSize: 15, marginBottom: 12, transition: "all 0.2s"
      }} />

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {LEVELS.map(l => (
          <button key={l} onClick={() => setLevel(l)} style={{
            padding: "6px 14px", borderRadius: 99, border: "2px solid",
            borderColor: level === l ? "var(--teal)" : "var(--cream2)",
            background: level === l ? "var(--teal)" : "white",
            color: level === l ? "white" : "var(--ink-soft)",
            fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s"
          }}>{l}</button>
        ))}
      </div>

      <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 12 }}>{filtered.length} words</div>

      {/* Word List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map(w => (
          <div key={w.id} className="word-card" style={{
            background: "white", borderRadius: 16, padding: "16px 18px", boxShadow: "var(--shadow)",
            border: selected === w.id ? "2px solid var(--teal)" : "2px solid transparent"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: selected === w.id ? 10 : 0 }}>
              <div onClick={() => setSelected(selected === w.id ? null : w.id)} style={{ flex: 1, cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <span className="lora" style={{ fontSize: 18, fontWeight: 700 }}>{w.word}</span>
                  <Badge level={w.level} />
                  {learnedWords.has(w.id) && <span style={{ fontSize: 16 }}>✅</span>}
                </div>
                <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>{w.phonetic} · {w.pos} · <span style={{ color: "var(--teal)", fontWeight: 500 }}>{w.vi}</span></div>
              </div>
              <SpeakBtn word={w.word} size={34} />
            </div>

            {selected === w.id && (
              <div className="fade-up">
                <div style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 6, lineHeight: 1.6 }}>{w.def}</div>
                <div style={{ background: "var(--teal-dim)", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontStyle: "italic", color: "var(--teal)", marginBottom: 12 }}>
                  "{w.ex}"
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => addWord(w)} className={addedPop === w.id ? "pop" : ""} style={{
                    flex: 1, padding: "9px 0", borderRadius: 10, border: "none",
                    background: myWords.find(x => x.id === w.id) ? "var(--green-light)" : "var(--teal)",
                    color: myWords.find(x => x.id === w.id) ? "var(--green)" : "white",
                    fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all 0.2s"
                  }}>
                    {myWords.find(x => x.id === w.id) ? "✅ Saved" : "➕ Add to My List"}
                  </button>
                  <button onClick={() => toggleLearned(w.id)} style={{
                    flex: 1, padding: "9px 0", borderRadius: 10, border: "2px solid",
                    borderColor: learnedWords.has(w.id) ? "var(--green)" : "var(--cream2)",
                    background: learnedWords.has(w.id) ? "var(--green-light)" : "white",
                    color: learnedWords.has(w.id) ? "var(--green)" : "var(--ink-soft)",
                    fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all 0.2s"
                  }}>
                    {learnedWords.has(w.id) ? "✅ I know this" : "📌 Mark as known"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── FLASHCARD ────────────────────────────────────────────────────────────────
function Flashcard({ myWords, learnedWords, setLearnedWords, onFinish }) {
  const pool = myWords.length > 0 ? myWords : WORDS.slice(0, 10);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [shuffled, setShuffled] = useState([...pool]);
  const [isShuffleOn, setIsShuffleOn] = useState(false);

  const cur = shuffled[idx] || pool[0];

  const next = () => { setFlipped(false); setTimeout(() => setIdx(i => (i + 1) % shuffled.length), 100); };
  const prev = () => { setFlipped(false); setTimeout(() => setIdx(i => (i - 1 + shuffled.length) % shuffled.length), 100); };

  const toggleShuffle = () => {
    if (!isShuffleOn) {
      const arr = [...pool].sort(() => Math.random() - 0.5);
      setShuffled(arr);
    } else {
      setShuffled([...pool]);
    }
    setIdx(0); setFlipped(false); setIsShuffleOn(!isShuffleOn);
  };

  const toggleLearned = () => {
    const s = new Set(learnedWords);
    s.has(cur.id) ? s.delete(cur.id) : s.add(cur.id);
    setLearnedWords(s);
  };

  if (pool.length === 0) return (
    <div style={{ textAlign: "center", padding: 60, color: "var(--ink-soft)" }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
      <p>No words yet. Add words in the <b>Learn</b> section!</p>
    </div>
  );

  return (
    <div className="fade-up" style={{ maxWidth: 700, margin: "0 auto", padding: "20px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 className="lora" style={{ fontSize: 24, fontWeight: 700 }}>🃏 Flashcard</h2>
        <button onClick={toggleShuffle} style={{
          padding: "8px 16px", borderRadius: 99, border: "2px solid",
          borderColor: isShuffleOn ? "var(--gold)" : "var(--cream2)",
          background: isShuffleOn ? "var(--gold-light)" : "white",
          color: isShuffleOn ? "var(--gold)" : "var(--ink-soft)",
          fontWeight: 600, fontSize: 13, cursor: "pointer"
        }}>🔀 Shuffle {isShuffleOn ? "ON" : "OFF"}</button>
      </div>

      {/* Progress */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, background: "var(--cream2)", borderRadius: 99, height: 6 }}>
          <div style={{ width: `${((idx + 1) / shuffled.length) * 100}%`, background: "var(--teal)", height: "100%", borderRadius: 99, transition: "width 0.3s" }} />
        </div>
        <span style={{ fontSize: 13, color: "var(--ink-soft)", whiteSpace: "nowrap" }}>{idx + 1} / {shuffled.length}</span>
      </div>

      {/* Card */}
      <div className="flip-card" onClick={() => setFlipped(!flipped)} style={{ height: 320, marginBottom: 20 }}>
        <div className={`flip-inner ${flipped ? "flipped" : ""}`} style={{ height: "100%" }}>
          {/* Front */}
          <div className="flip-face" style={{ background: "linear-gradient(135deg,var(--teal),var(--teal-light))", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, color: "rgba(255,255,255,0.7)" }}>CLICK TO FLIP</div>
            <div className="lora" style={{ fontSize: 44, fontWeight: 700, color: "white" }}>{cur.word}</div>
            <div style={{ fontSize: 16, color: "rgba(255,255,255,0.85)" }}>{cur.phonetic}</div>
            <Badge level={cur.level} />
            <div onClick={e => { e.stopPropagation(); speak(cur.word) }} style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, cursor: "pointer", border: "2px solid rgba(255,255,255,0.4)" }}>🔊</div>
          </div>
          {/* Back */}
          <div className="flip-face flip-back" style={{ background: "white", border: "3px solid var(--teal-dim)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 28, gap: 10, textAlign: "center" }}>
            <div className="lora" style={{ fontSize: 28, fontWeight: 700, color: "var(--teal)" }}>{cur.word}</div>
            <div style={{ fontSize: 14, color: "var(--ink-soft)" }}>{cur.phonetic} · <em>{cur.pos}</em></div>
            <div style={{ fontSize: 20, fontWeight: 600, color: "var(--ink)" }}>{cur.vi}</div>
            <div style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6, borderTop: "1px solid var(--cream2)", paddingTop: 10 }}>{cur.def}</div>
            <div style={{ fontSize: 13, fontStyle: "italic", color: "var(--teal)", background: "var(--teal-dim)", padding: "8px 14px", borderRadius: 10 }}>"{cur.ex}"</div>
            <div onClick={e => { e.stopPropagation(); speak(cur.word) }} style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--teal-dim)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, cursor: "pointer" }}>🔊</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        <button onClick={prev} style={{ width: 48, height: 48, borderRadius: "50%", border: "2px solid var(--cream2)", background: "white", fontSize: 20, cursor: "pointer", fontWeight: 700 }}>←</button>
        <button onClick={toggleLearned} style={{
          flex: 1, maxWidth: 200, padding: "12px 0", borderRadius: 12, border: "2px solid",
          borderColor: learnedWords.has(cur?.id) ? "var(--green)" : "var(--cream2)",
          background: learnedWords.has(cur?.id) ? "var(--green-light)" : "white",
          color: learnedWords.has(cur?.id) ? "var(--green)" : "var(--ink-soft)",
          fontWeight: 600, fontSize: 14, cursor: "pointer", transition: "all 0.2s"
        }}>
          {learnedWords.has(cur?.id) ? "✅ Mastered" : "📌 Mark as mastered"}
        </button>
        <button onClick={next} style={{ width: 48, height: 48, borderRadius: "50%", border: "2px solid var(--cream2)", background: "white", fontSize: 20, cursor: "pointer", fontWeight: 700 }}>→</button>
      </div>

      {onFinish && (
        <button onClick={onFinish} style={{
          width: "100%", padding: "16px", borderRadius: 12, border: "none", background: "var(--teal)", color: "white",
          fontWeight: 700, fontSize: 16, cursor: "pointer", transition: "all 0.2s", boxShadow: "0 4px 12px rgba(45,188,140,0.3)"
        }}>
          Done Learning? Take the Quiz ➡️
        </button>
      )}
    </div>
  );
}

// ─── QUIZ ─────────────────────────────────────────────────────────────────────
function Quiz({ myWords, customPool, onFinish }) {
  const pool = useMemo(() => {
    if (customPool && customPool.length > 0) return [...customPool].sort(() => Math.random() - 0.5);
    const source = myWords.length >= 5 ? myWords : WORDS;
    return [...source].sort(() => Math.random() - 0.5).slice(0, 10);
  }, [customPool, myWords]);
  const [qi, setQi] = useState(0);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState(null); // null | 'correct' | 'wrong'
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [hint, setHint] = useState(false);
  const [animClass, setAnimClass] = useState("");

  const cur = pool[qi];

  const submit = () => {
    if (!answer.trim()) return;
    const correct = answer.trim().toLowerCase() === cur.word.toLowerCase();
    setResult(correct ? "correct" : "wrong");
    if (correct) setScore(s => s + 1);
    setAnimClass(correct ? "pop" : "shake");
    setTimeout(() => setAnimClass(""), 500);
  };

  const next = () => {
    if (qi + 1 >= pool.length) { setDone(true); return; }
    setQi(qi + 1);
    setAnswer("");
    setResult(null);
    setHint(false);
  };

  const restart = () => { setQi(0); setAnswer(""); setResult(null); setScore(0); setDone(false); setHint(false); };

  if (done) return (
    <div className="fade-up" style={{ maxWidth: 500, margin: "60px auto", padding: "0 16px", textAlign: "center" }}>
      <div style={{ fontSize: 72, marginBottom: 16 }}>{score >= pool.length * 0.8 ? "🏆" : score >= pool.length * 0.5 ? "👍" : "💪"}</div>
      <h2 className="lora" style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Results</h2>
      <div style={{ fontSize: 52, fontWeight: 800, color: "var(--teal)", marginBottom: 4 }}>{score}<span style={{ fontSize: 24, color: "var(--ink-soft)" }}>/{pool.length}</span></div>
      <p style={{ color: "var(--ink-soft)", marginBottom: 24, fontSize: 16 }}>
        {score >= pool.length * 0.8 ? "Excellent! You did great! 🎉" : score >= pool.length * 0.5 ? "Good job! Keep it up! 💪" : "Keep trying! Practice more! 📚"}
      </p>
      <button onClick={restart} style={{ padding: "14px 36px", background: "var(--teal)", color: "white", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer", marginBottom: 12 }}>
        🔄 Try Again
      </button>
      {onFinish && (
        <div style={{ marginTop: 12 }}>
          <button onClick={onFinish} style={{ padding: "14px 36px", background: "var(--gold)", color: "white", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
            🏆 Complete Session
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="fade-up" style={{ maxWidth: 600, margin: "0 auto", padding: "20px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 className="lora" style={{ fontSize: 24, fontWeight: 700 }}>✏️ Fill in the Blank</h2>
        <div style={{ fontWeight: 700, color: "var(--teal)", fontSize: 16 }}>{score} pts</div>
      </div>

      {/* Progress */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ flex: 1, background: "var(--cream2)", borderRadius: 99, height: 8 }}>
          <div style={{ width: `${((qi + 1) / pool.length) * 100}%`, background: "var(--teal)", height: "100%", borderRadius: 99, transition: "width 0.3s" }} />
        </div>
        <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>{qi + 1}/{pool.length}</span>
      </div>

      <div className={animClass} style={{ background: "white", borderRadius: 20, padding: "28px 24px", boxShadow: "var(--shadow)", marginBottom: 20 }}>
        {/* Sentence */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, color: "var(--ink-soft)", marginBottom: 10 }}>FILL IN THE MISSING WORD</div>
          <p style={{ fontSize: 18, lineHeight: 1.8, color: "var(--ink)" }}>
            {cur.blank.split("_____").map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && (
                  <span style={{
                    display: "inline-block", minWidth: 90, borderBottom: "3px solid",
                    borderColor: result === "correct" ? "var(--green)" : result === "wrong" ? "var(--red)" : "var(--teal)",
                    color: result === "correct" ? "var(--green)" : result === "wrong" ? "var(--red)" : "var(--teal)",
                    fontWeight: 700, textAlign: "center", padding: "0 6px", lineHeight: "2"
                  }}>
                    {result ? cur.word : "\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0"}
                  </span>
                )}
              </span>
            ))}
          </p>
        </div>

        {/* Meaning hint */}
        <div style={{ background: "var(--gold-light)", borderRadius: 10, padding: "10px 14px", fontSize: 14, color: "#8B5E1A", marginBottom: 16 }}>
          🇻🇳 <strong>Meaning:</strong> {cur.vi} · <em>{cur.pos}</em>
        </div>

        {/* Letter hint */}
        {hint && (
          <div style={{ fontSize: 13, color: "var(--teal)", marginBottom: 12 }}>
            💡 Hint: <strong>{cur.word[0].toUpperCase()}</strong>{"_".repeat(cur.word.length - 1)} ({cur.word.length} letters)
          </div>
        )}

        {/* Input */}
        {!result && (
          <div style={{ display: "flex", gap: 10 }}>
            <input value={answer} onChange={e => setAnswer(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
              placeholder="Type your answer..." style={{
                flex: 1, padding: "12px 16px", borderRadius: 12, border: "2px solid var(--cream2)",
                fontSize: 16, fontFamily: "'Lora',serif", fontWeight: 600, transition: "all 0.2s"
              }} autoFocus />
            <button onClick={submit} style={{ padding: "12px 20px", background: "var(--teal)", color: "white", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>✓</button>
          </div>
        )}

        {/* Result */}
        {result && (
          <div style={{
            background: result === "correct" ? "var(--green-light)" : "var(--red-light)",
            border: `2px solid ${result === "correct" ? "var(--green)" : "var(--red)"}`,
            borderRadius: 12, padding: "14px 16px"
          }}>
            <div style={{ fontWeight: 700, color: result === "correct" ? "var(--green)" : "var(--red)", marginBottom: 4 }}>
              {result === "correct" ? "✅ Correct!" : `❌ Wrong! Answer: "${cur.word}"`}
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>{cur.def}</div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10 }}>
        {!result && <button onClick={() => setHint(true)} style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "2px solid var(--cream2)", background: "white", color: "var(--ink-soft)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
          💡 Hint
        </button>}
        {!result && <SpeakBtn word={cur.word} size={46} />}
        {result && <button onClick={next} style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "none", background: "var(--teal)", color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
          {qi + 1 >= pool.length ? "🏁 See Results" : "Next →"}
        </button>}
        {result && <SpeakBtn word={cur.word} size={46} />}
      </div>
    </div>
  );
}

// ─── REVIEW ───────────────────────────────────────────────────────────────────
function Review({ myWords, learnedWords, dailyStats, initialTab = "today" }) {
  const [tab, setTab] = useState(initialTab);
  const [sort, setSort] = useState("date");
  const [detail, setDetail] = useState(null);

  const stats = dailyStats?.masteredIds || [];
  const tabs = [
    { key: "today", label: "Mastered Today", count: myWords.filter(w => stats.includes(w.id)).length },
    { key: "all_mastered", label: "Total Mastered", count: myWords.filter(w => learnedWords.has(w.id)).length },
  ];

  let shown = tab === "today" ? myWords.filter(w => stats.includes(w.id)) : myWords.filter(w => learnedWords.has(w.id));
  if (sort === "alpha") shown = [...shown].sort((a, b) => a.word.localeCompare(b.word));
  else if (sort === "level") shown = [...shown].sort((a, b) => a.level.localeCompare(b.level));

  const remove = (id) => {
    setMyWords(myWords.filter(w => w.id !== id));
    const s = new Set(learnedWords); s.delete(id); setLearnedWords(s);
    if (detail?.id === id) setDetail(null);
  };

  const handleClearCurrentTab = () => {
    if (window.handleClearTab) window.handleClearTab(tab);
  };

  return (
    <div className="fade-up" style={{ maxWidth: 700, margin: "0 auto", padding: "20px 16px" }}>
      <h2 className="lora" style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>🔁 Review</h2>

      {/* Tabs */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8 }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: "8px 16px", borderRadius: 99, border: "2px solid",
              borderColor: tab === t.key ? "var(--teal)" : "var(--cream2)",
              background: tab === t.key ? "var(--teal)" : "white",
              color: tab === t.key ? "white" : "var(--ink-soft)",
              fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all 0.2s"
            }}>{t.label} <span style={{ opacity: 0.75 }}>({t.count})</span></button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
        <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>Sort by:</span>
        {[["date", "Date Added"], ["alpha", "A–Z"], ["level", "Level"]].map(([k, l]) => (
          <button key={k} onClick={() => setSort(k)} style={{
            padding: "5px 12px", borderRadius: 99, border: "1px solid",
            borderColor: sort === k ? "var(--teal)" : "var(--cream2)",
            background: sort === k ? "var(--teal-dim)" : "white",
            color: sort === k ? "var(--teal)" : "var(--ink-soft)",
            fontSize: 12, fontWeight: 600, cursor: "pointer"
          }}>{l}</button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--ink-soft)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <p>No words in this list yet.<br />Add words in the <b>Learn</b> section!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {shown.map(w => (
            <div key={w.id} style={{ background: "white", borderRadius: 16, boxShadow: "var(--shadow)", overflow: "hidden", border: detail?.id === w.id ? "2px solid var(--teal)" : "2px solid transparent" }}>
              <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                <div onClick={() => setDetail(detail?.id === w.id ? null : w)} style={{ flex: 1, cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span className="lora" style={{ fontSize: 17, fontWeight: 700 }}>{w.word}</span>
                    <Badge level={w.level} />
                  </div>
                  <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>{w.vi}</div>
                </div>
                <SpeakBtn word={w.word} size={32} />
              </div>
              {detail?.id === w.id && (
                <div className="fade-up" style={{ borderTop: "1px solid var(--cream2)", padding: "14px 16px", background: "var(--cream)" }}>
                  <div style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.7, marginBottom: 8 }}>{w.def}</div>
                  <div style={{ fontSize: 13, fontStyle: "italic", color: "var(--teal)", background: "var(--teal-dim)", padding: "8px 12px", borderRadius: 8, marginBottom: 0 }}>"{w.ex}"</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── STUDYING / MASTERED LISTS ────────────────────────────────────────────────
function WordList({ title, icon, words, learnedWords, setLearnedWords, setMyWords, isMasteredView }) {
  const [sort, setSort] = useState("date");
  const [detail, setDetail] = useState(null);

  let shown = [...words];
  if (sort === "alpha") shown.sort((a, b) => a.word.localeCompare(b.word));
  else if (sort === "level") shown.sort((a, b) => a.level.localeCompare(b.level));

  const remove = (id) => {
    setMyWords(words.filter(w => w.id !== id));
    const s = new Set(learnedWords); s.delete(id); setLearnedWords(s);
    if (detail?.id === id) setDetail(null);
  };

  const handleClear = () => {
    if (window.handleClearTab) window.handleClearTab(isMasteredView ? "learned" : "todo");
  };

  return (
    <div className="fade-up" style={{ maxWidth: 700, margin: "0 auto", padding: "20px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 className="lora" style={{ fontSize: 24, fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}>
          {icon} {title}
        </h2>
        {shown.length > 0 && (
          <button onClick={handleClear} style={{
            padding: "8px 16px", borderRadius: 99, border: "1px solid var(--red-light)", background: "var(--red-light)", color: "var(--red)", fontWeight: 600, fontSize: 13, cursor: "pointer"
          }}>
            🗑️ Clear List
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
        <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>Sort by:</span>
        {[["date", "Date Added"], ["alpha", "A–Z"], ["level", "Level"]].map(([k, l]) => (
          <button key={k} onClick={() => setSort(k)} style={{ padding: "5px 12px", borderRadius: 99, border: "1px solid", borderColor: sort === k ? "var(--teal)" : "var(--cream2)", background: sort === k ? "var(--teal-dim)" : "white", color: sort === k ? "var(--teal)" : "var(--ink-soft)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{l}</button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--ink-soft)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <p>No words found here.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {shown.map(w => (
            <div key={w.id} style={{ background: "white", borderRadius: 16, boxShadow: "var(--shadow)", overflow: "hidden", border: detail?.id === w.id ? "2px solid var(--teal)" : "2px solid transparent" }}>
              <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                <div onClick={() => setDetail(detail?.id === w.id ? null : w)} style={{ flex: 1, cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}><span className="lora" style={{ fontSize: 17, fontWeight: 700 }}>{w.word}</span><Badge level={w.level} /></div>
                  <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>{w.vi}</div>
                </div>
                <SpeakBtn word={w.word} size={32} />
                <button
                  onClick={() => { const s = new Set(learnedWords); s.has(w.id) ? s.delete(w.id) : s.add(w.id); setLearnedWords(s, w.id); }}
                  style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid", borderColor: learnedWords.has(w.id) ? "var(--green)" : "var(--cream2)", background: learnedWords.has(w.id) ? "var(--green-light)" : "white", color: learnedWords.has(w.id) ? "var(--green)" : "var(--ink-soft)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}
                  title={learnedWords.has(w.id) ? "Mastered" : "Mark as mastered"}
                >✓</button>
                <button onClick={() => remove(w.id)} style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "var(--red-light)", color: "var(--red)", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
              </div>
              {detail?.id === w.id && (
                <div className="fade-up" style={{ borderTop: "1px solid var(--cream2)", padding: "14px 16px", background: "var(--cream)" }}>
                  <div style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.7, marginBottom: 8 }}>{w.def}</div>
                  <div style={{ fontSize: 13, fontStyle: "italic", color: "var(--teal)", background: "var(--teal-dim)", padding: "8px 12px", borderRadius: 8, marginBottom: 0 }}>"{w.ex}"</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PROFILE ───────────────────────────────────────────────────────────────────
function Profile({ user, token, setUser }) {
  const [fullName, setFullName] = useState(user.fullName || '');
  const [dob, setDob] = useState(user.dob || '');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch(`${API_BASE}/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ fullName, dob })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'An error occurred');

      const updatedUser = { ...user, fullName, dob };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setMsg('Profile updated successfully!');
    } catch (err) {
      setMsg(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-up" style={{ maxWidth: 500, margin: "40px auto", padding: "30px 24px", background: "white", borderRadius: 20, boxShadow: "var(--shadow)" }}>
      <h2 className="lora" style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>👤 Profile</h2>

      {msg && (
        <div style={{
          background: msg.includes('success') ? 'var(--green-light)' : 'var(--red-light)',
          color: msg.includes('success') ? 'var(--green)' : 'var(--red)',
          padding: "12px", borderRadius: 8, fontSize: 14, marginBottom: 20, textAlign: "center", fontWeight: 500
        }}>
          {msg}
        </div>
      )}

      <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6, display: "block" }}>Username (Cannot be changed)</label>
          <input value={user.username} readOnly disabled
            style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "2px solid var(--cream2)", fontSize: 15, background: "var(--cream2)", color: "var(--ink-soft)" }} />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6, display: "block" }}>Full Name</label>
          <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="E.g. Nguyen Van A"
            style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "2px solid var(--cream2)", fontSize: 15 }} />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6, display: "block" }}>Date of Birth</label>
          <input type="date" value={dob} onChange={e => setDob(e.target.value)}
            style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "2px solid var(--cream2)", fontSize: 15 }} />
        </div>

        <button type="submit" disabled={loading} style={{
          padding: "14px", borderRadius: 12, border: "none", background: "var(--teal)", color: "white",
          fontWeight: 700, fontSize: 16, cursor: loading ? "not-allowed" : "pointer", marginTop: 8,
          opacity: loading ? 0.7 : 1
        }}>
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}

// ─── AUTHENTICATION SCREENS ─────────────────────────────────────────────────────
function AuthScreen({ onLogin, type, setType }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (type === 'login') {
        const res = await fetch(`${API_BASE}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'An error occurred');
        onLogin(data.token, data.user);
      } else if (type === 'forgot') {
        const res = await fetch(`${API_BASE}/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, dob, newPassword })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'An error occurred');
        setType('login');
        setError('Password reset successfully! Please log in.');
      } else {
        const res = await fetch(`${API_BASE}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, fullName, dob })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'An error occurred');
        if (res.status === 201) {
          setType('login');
          setError('Registration successful! Please log in.');
        }
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-up" style={{ maxWidth: 400, margin: "60px auto", padding: "30px 24px", background: "white", borderRadius: 20, boxShadow: "var(--shadow-lg)" }}>
      <div className="lora" style={{ fontSize: 28, fontWeight: 700, color: "var(--teal)", textAlign: "center", marginBottom: 24 }}>
        {type === 'login' ? 'Welcome Back' : type === 'forgot' ? 'Reset Password' : 'Create an Account'}
      </div>

      {error && (
        <div style={{
          background: type === 'login' && error.includes('successful') ? 'var(--green-light)' : 'var(--red-light)',
          color: type === 'login' && error.includes('successful') ? 'var(--green)' : 'var(--red)',
          padding: "12px", borderRadius: 8, fontSize: 13, marginBottom: 16, textAlign: "center"
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6, display: "block" }}>Username</label>
          <input value={username} onChange={e => setUsername(e.target.value)} required
            style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "2px solid var(--cream2)", fontSize: 15 }} />
        </div>

        {type === 'register' && (
          <>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6, display: "block" }}>Full Name</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="E.g. Nguyen Van A"
                style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "2px solid var(--cream2)", fontSize: 15 }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6, display: "block" }}>Date of Birth</label>
              <input type="date" value={dob} onChange={e => setDob(e.target.value)} required
                style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "2px solid var(--cream2)", fontSize: 15 }} />
            </div>
          </>
        )}

        {type === 'forgot' && (
          <>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6, display: "block" }}>Date of Birth <span style={{ fontWeight: 'normal' }}> (Used for verification)</span></label>
              <input type="date" value={dob} onChange={e => setDob(e.target.value)} required
                style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "2px solid var(--cream2)", fontSize: 15 }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6, display: "block" }}>New Password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required
                style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "2px solid var(--cream2)", fontSize: 15 }} />
            </div>
          </>
        )}

        {type !== 'forgot' && (
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6, display: "block" }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "2px solid var(--cream2)", fontSize: 15 }} />
          </div>
        )}

        {type === 'login' && (
          <div style={{ textAlign: "right" }}>
            <span onClick={() => { setType('forgot'); setError(''); }} style={{ fontSize: 13, color: "var(--ink-soft)", cursor: "pointer", opacity: 0.8 }}>Forgot Password?</span>
          </div>
        )}

        <button type="submit" disabled={loading} style={{
          padding: "14px", borderRadius: 12, border: "none", background: "var(--teal)", color: "white",
          fontWeight: 700, fontSize: 16, cursor: loading ? "not-allowed" : "pointer", marginTop: 8,
          opacity: loading ? 0.7 : 1
        }}>
          {loading ? 'Processing...' : (type === 'login' ? 'Log In' : type === 'forgot' ? 'Reset Password' : 'Sign Up')}
        </button>
      </form>

      <div style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "var(--ink-soft)" }}>
        {type === 'login' ? "Don't have an account? " : type === 'forgot' ? "Remember your password? " : "Already have an account? "}
        <span onClick={() => { setType(type === 'login' ? 'register' : 'login'); setError(''); }}
          style={{ color: "var(--teal)", fontWeight: 600, cursor: "pointer" }}>
          {type === 'login' ? 'Sign up' : 'Log in'}
        </span>
      </div>


    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("home");
  const [reviewTab, setReviewTab] = useState("all");
  const [myWords, setMyWords] = useState([]);
  const [learnedWords, setLearnedWords] = useState(new Set());
  const [sessionWords, setSessionWords] = useState(null);

  // Auth state
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [authType, setAuthType] = useState('login');

  // Daily Goal State
  const [dailyGoal, setDailyGoal] = useState(() => parseInt(localStorage.getItem('dailyGoal')) || 10);
  const [dailyStats, setDailyStats] = useState(() => {
    const defaultStats = { date: new Date().toDateString(), progress: 0, masteredIds: [] };
    const stored = localStorage.getItem('dailyStats');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.date === new Date().toDateString()) return { ...defaultStats, ...parsed };
    }
    return defaultStats;
  });

  useEffect(() => {
    localStorage.setItem('dailyGoal', dailyGoal);
  }, [dailyGoal]);

  useEffect(() => {
    localStorage.setItem('dailyStats', JSON.stringify(dailyStats));
  }, [dailyStats]);

  // Load words from DB on login / token presence
  useEffect(() => {
    if (token) {
      fetch(`${API_BASE}/user/words`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(async res => {
          if (!res.ok) {
            if (res.status === 401 || res.status === 403) handleLogout();
            throw new Error("Failed");
          }
          return res.json();
        })
        .then(data => {
          const { saved, mastered } = data;
          const savedWords = WORDS.filter(w => saved.includes(w.id) || mastered.includes(w.id));
          setMyWords(savedWords);
          setLearnedWords(new Set(mastered));
        })
        .catch(err => {
          console.error("Failed to load user words:", err);
          alert("Could not connect to the backend server. Make sure you run 'node server.js' inside the vocab-backend folder.");
        });
    } else {
      setMyWords([]);
      setLearnedWords(new Set());
    }
  }, [token]);

  const handleLogin = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setScreen("home");
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  window.handleClearTab = async (tab) => {
    if (!token) return;
    const isAll = tab === 'all';
    const isMastered = tab === 'learned';
    const isStudying = tab === 'todo';
    const label = isAll ? 'all saved words' : (isMastered ? 'all mastered words' : 'all studying words');

    if (!window.confirm(`Are you sure you want to clear ${label}? This cannot be undone.`)) return;

    let queryParam = '';
    if (isMastered) queryParam = '?status=mastered';
    else if (isStudying) queryParam = '?status=saved';

    try {
      const res = await fetch(`${API_BASE}/user/words${queryParam}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to clear words');

      if (isAll) {
        setMyWords([]);
        setLearnedWords(new Set());
      } else if (isMastered) {
        setMyWords(prev => prev.filter(w => !learnedWords.has(w.id)));
        setLearnedWords(new Set());
      } else if (isStudying) {
        setMyWords(prev => prev.filter(w => learnedWords.has(w.id)));
      }

      alert(`${label.charAt(0).toUpperCase() + label.slice(1)} cleared successfully!`);
    } catch (err) {
      console.error(err);
      alert("Error clearing words.");
    }
  };

  window.handleBulkAdd = async (amount) => {
    if (!token) return;

    // Pick random unsaved words
    const unsavedWords = WORDS.filter(w => !myWords.find(mw => mw.id === w.id));
    const shuffled = [...unsavedWords].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, amount);

    if (selected.length === 0) {
      alert("No more unsaved words available!");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/user/words/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ wordIds: selected.map(w => w.id) })
      });
      if (!res.ok) throw new Error('Failed to bulk add');

      setMyWords(prev => [...prev, ...selected]);
      if (typeof startSession === 'function') {
        startSession(selected);
      } else {
        alert(`Successfully added ${selected.length} random words!`);
      }
    } catch (err) {
      console.error(err);
      alert(`Error linking to server (${err.message}). Is 'node server.js' running?`);
    }
  };

  const syncWordStatus = async (wordId, status) => {
    if (!token) return;
    try {
      await fetch(`${API_BASE}/user/words`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ wordId, status })
      });
    } catch (err) { console.error("Failed to sync word:", err); }
  };

  const removeWordDb = async (wordId) => {
    if (!token) return;
    try {
      await fetch(`${API_BASE}/user/words/${wordId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) { console.error("Failed to remove word:", err); }
  };

  // Wrapped State Setters that sync to Backend
  const handleSetMyWords = (newWords, addedWord) => {
    setMyWords(newWords);
    if (addedWord) syncWordStatus(addedWord.id, 'saved');
  };

  const handleSetLearnedWords = (newLearnedIds, toggledId) => {
    // Determine if it was added or removed from learned set
    const isLearnedNow = newLearnedIds.has(toggledId);
    setLearnedWords(newLearnedIds);
    syncWordStatus(toggledId, isLearnedNow ? 'mastered' : 'saved');

    // Daily progress logic
    if (isLearnedNow) {
      setDailyStats(prev => {
        const today = new Date().toDateString();
        const stats = prev.date === today ? prev : { date: today, progress: 0, masteredIds: [] };
        if (!stats.masteredIds.includes(toggledId)) {
          return { ...stats, progress: stats.progress + 1, masteredIds: [...stats.masteredIds, toggledId] };
        }
        return stats;
      });
    } else {
      setDailyStats(prev => {
        const today = new Date().toDateString();
        const stats = prev.date === today ? prev : { date: today, progress: 0, masteredIds: [] };
        if (stats.masteredIds.includes(toggledId)) {
          return { ...stats, progress: Math.max(0, stats.progress - 1), masteredIds: stats.masteredIds.filter(id => id !== toggledId) };
        }
        return stats;
      });
    }
  };

  const handleRemoveWord = (wordId) => {
    setMyWords(prev => prev.filter(w => w.id !== wordId));
    setLearnedWords(prev => {
      const s = new Set(prev);
      s.delete(wordId);
      return s;
    });
    removeWordDb(wordId);
  };

  const navItems = [
    { key: "home", icon: "🏠", label: "Home" },
    { key: "learn", icon: "📖", label: "Learn" },
    { key: "studying", icon: "📚", label: "Studying" },
    { key: "mastered", icon: "✅", label: "Mastered" },
    { key: "review", icon: "🔁", label: "Review" },
  ];

  const goToReviewTab = (tabName) => {
    setReviewTab(tabName);
    setScreen("review");
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", paddingBottom: 80 }}>
      <style>{FONT_STYLE}</style>

      {/* Header */}
      <div style={{ background: "white", borderBottom: "2px solid var(--cream2)", position: "sticky", top: 0, zIndex: 100, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
        <div className="lora" onClick={() => token && setScreen("home")} style={{ fontWeight: 700, fontSize: 20, color: "var(--teal)", cursor: "pointer" }}>
          📚 VocabMaster
        </div>

        {token ? (
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div onClick={() => setScreen("review")} style={{ fontSize: 13, color: "var(--ink-soft)", cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "var(--teal)"} onMouseLeave={e => e.currentTarget.style.color = "var(--ink-soft)"}>
              {myWords.length} saved · {learnedWords.size} mastered
            </div>
            <button onClick={() => setScreen("profile")} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--cream2)", background: "white", color: "var(--ink-soft)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Profile</button>
            <button onClick={handleLogout} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--red-light)", background: "var(--red-light)", color: "var(--red)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Log out</button>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>Not logged in</div>
        )}
      </div>

      {/* Content */}
      <div key={screen}>
        {!token ? (
          <AuthScreen onLogin={handleLogin} type={authType} setType={setAuthType} />
        ) : (
          <>
            {screen === "home" && <Dashboard myWords={myWords} learnedWords={learnedWords} setScreen={setScreen} user={user} goToReviewTab={goToReviewTab} dailyGoal={dailyGoal} dailyStats={dailyStats} setDailyGoal={setDailyGoal} startSession={(words) => { setSessionWords(words); setScreen('session_flashcard'); }} />}
            {screen === "learn" && <Learn myWords={myWords} setMyWords={(w, added) => handleSetMyWords(w, added)} learnedWords={learnedWords} setLearnedWords={(w, toggled) => handleSetLearnedWords(w, toggled)} />}
            {screen === "studying" && <WordList title="Studying List" icon="📚" words={myWords.filter(w => !learnedWords.has(w.id))} learnedWords={learnedWords} setLearnedWords={handleSetLearnedWords} setMyWords={handleSetMyWords} isMasteredView={false} />}
            {screen === "mastered" && <WordList title="Mastered List" icon="✅" words={myWords.filter(w => learnedWords.has(w.id))} learnedWords={learnedWords} setLearnedWords={handleSetLearnedWords} setMyWords={handleSetMyWords} isMasteredView={true} />}
            {screen === "review" && <Review myWords={myWords} learnedWords={learnedWords} dailyStats={dailyStats} initialTab={reviewTab} />}
            {screen === "profile" && <Profile user={user} token={token} setUser={setUser} />}
            {screen === "session_flashcard" && <Flashcard myWords={sessionWords || []} learnedWords={learnedWords} setLearnedWords={handleSetLearnedWords} onFinish={() => setScreen("session_quiz")} />}
            {screen === "session_quiz" && <Quiz myWords={sessionWords || []} customPool={sessionWords} onFinish={() => { setSessionWords(null); setScreen("home"); }} />}
          </>
        )}
      </div>

      {/* Bottom Nav */}
      {token && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "white", borderTop: "2px solid var(--cream2)", display: "flex", zIndex: 100, padding: "8px 4px 10px" }}>
          {navItems.map(n => (
            <button key={n.key} onClick={() => setScreen(n.key)} className={`nav - btn ${screen === n.key ? "active" : ""} `} style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              padding: "6px 4px", borderRadius: 12, border: "none",
              background: screen === n.key ? "var(--teal)" : "transparent",
              color: screen === n.key ? "white" : "var(--ink-soft)",
              cursor: "pointer", fontSize: 10, fontWeight: 600
            }}>
              <span style={{ fontSize: 20 }}>{n.icon}</span>
              {n.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}