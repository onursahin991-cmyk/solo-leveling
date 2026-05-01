import { useState, useEffect, useRef } from "react";

const RANK_COLORS = {
  "E": "#6b7280", "D": "#10b981", "C": "#3b82f6",
  "B": "#8b5cf6", "A": "#f59e0b", "S": "#ef4444", "S+": "#ff6b35"
};
const RANK_GLOWS = {
  "E": "rgba(107,114,128,0.35)", "D": "rgba(16,185,129,0.35)",
  "C": "rgba(59,130,246,0.35)", "B": "rgba(139,92,246,0.35)",
  "A": "rgba(245,158,11,0.4)", "S": "rgba(239,68,68,0.5)",
  "S+": "rgba(255,107,53,0.6)"
};

const QUESTIONS = [
  { id: "pushup", label: "Şınav", question: "Kaç şınav çekebiliyorsun?", unit: "tekrar" },
  { id: "situp", label: "Mekik", question: "Kaç mekik yapabiliyorsun?", unit: "tekrar" },
  { id: "squat", label: "Squat", question: "Kaç squat yapabiliyorsun?", unit: "tekrar" },
  { id: "plank", label: "Plank", question: "Kaç saniye plank tutabiliyorsun?", unit: "saniye" },
  { id: "run", label: "Koşu", question: "Hiç durmadan kaç dakika koşabiliyorsun?", unit: "dakika" },
  { id: "pullup", label: "Barfiks", question: "Kaç barfiks çekebiliyorsun? (0 yazabilirsin)", unit: "tekrar" },
];

const CATEGORY_INFO = {
  "güç": { icon: "⚔️", color: "#ef4444" },
  "dayanıklılık": { icon: "🛡️", color: "#10b981" },
  "çeviklik": { icon: "⚡", color: "#3b82f6" },
  "irade": { icon: "🔮", color: "#8b5cf6" },
  "meditasyon": { icon: "🧘", color: "#06b6d4" },
  "denge": { icon: "⚖️", color: "#f59e0b" },
  "duyular": { icon: "👁️", color: "#ec4899" },
};

const DIFF_COLORS = { "KOLAY": "#10b981", "ORTA": "#f59e0b", "ZOR": "#ef4444" };

const MEDITATION_EXERCISES = [
  { name: "4-7-8 Nefes Tekniği", desc: "4 sn nefes al → 7 sn tut → 8 sn ver. 4 tur tekrarla.", time: "5 dk", xp: 60 },
  { name: "Beden Tarama", desc: "Ayak parmaklarından başa kadar her kas grubunu kasıp bırak, odaklan.", time: "10 dk", xp: 80 },
  { name: "Görselleştirme", desc: "Gözleri kapat. Kendini en güçlü halinle hayal et. Her detayı hisset.", time: "7 dk", xp: 70 },
  { name: "Kutu Nefes", desc: "4 sn nefes al → 4 sn tut → 4 sn ver → 4 sn tut. 6 tur.", time: "4 dk", xp: 55 },
];

const BALANCE_EXERCISES = [
  { name: "Tek Ayak Duruş", desc: "Gözler açık tek ayakta dur. Her bacak için 60 saniye.", time: "2 dk", xp: 50 },
  { name: "Gözler Kapalı Denge", desc: "Tek ayakta gözleri kapat. Her bacak 30 saniye. Zorlu!", time: "2 dk", xp: 80 },
  { name: "Derin Squat Dengesi", desc: "En aşağıda 10 saniye dur, denge kur. 5 tekrar.", time: "3 dk", xp: 65 },
  { name: "Topuk-Parmak Yürüyüşü", desc: "Düz çizgide yürü, her adımda topuk parmağa değsin. 20 adım.", time: "2 dk", xp: 45 },
];

const SENSE_EXERCISES = [
  { name: "Periferik Görüş", desc: "Sabit bir noktaya bak. Gözleri oynatmadan çevreni algılamaya çalış.", time: "3 dk", xp: 70 },
  { name: "Göz Odaklama", desc: "Yakındaki nesneye 5 sn, uzaktakine 5 sn bak. 10 tekrar.", time: "2 dk", xp: 55 },
  { name: "İşitsel Farkındalık", desc: "Gözleri kapat. Etrafındaki tüm sesleri tek tek ayırt etmeye çalış.", time: "5 dk", xp: 75 },
  { name: "Dokunsal Tarama", desc: "Yavaşça yürü, ayaklarının altındaki her dokuyu hisset. Çıplak ayak ideal.", time: "5 dk", xp: 65 },
];

const SAVE_KEY = "solo_leveling_v2";
const saveMem = (d) => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(d)); } catch(e) {} };
const loadMem = () => { try { const r = localStorage.getItem(SAVE_KEY); return r ? JSON.parse(r) : null; } catch(e) { return null; } };

// ── Claude API call (Gemini implementation) ──
const callClaude = async (system, userMsg, history = []) => {
  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_API_KEY", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        ...history.map(h => ({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.content }]
        })),
        {
          role: "user",
          parts: [{ text: `${system}\n\nKullanıcı Mesajı: ${userMsg}` }]
        }
      ]
    })
  });

  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();
  if (!data.candidates || !data.candidates[0]) throw new Error("Empty response");
  return data.candidates[0].content.parts[0].text;
};

// ── Styles injected once ──
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Rajdhani:wght@400;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:#0a0f1a}::-webkit-scrollbar-thumb{background:#334155}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes spinR{to{transform:rotate(-360deg)}}
@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes rankIn{0%{transform:scale(0.4);opacity:0}70%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
@keyframes lvlUp{0%{opacity:1;transform:scale(1) translateY(0)}100%{opacity:0;transform:scale(2.2) translateY(-40px)}}
@keyframes pFloat{0%,100%{transform:translateY(0) translateX(0);opacity:.3}50%{transform:translateY(-18px) translateX(8px);opacity:.7}}
@keyframes borderPulse{0%,100%{border-color:rgba(79,70,229,.25)}50%{border-color:rgba(139,92,246,.6);box-shadow:0 0 16px rgba(139,92,246,.2)}}
@keyframes saveFlash{0%{opacity:0;transform:translateY(6px)}20%{opacity:1;transform:translateY(0)}80%{opacity:1}100%{opacity:0}}
.sl-btn{background:linear-gradient(135deg,#1e1b4b,#312e81);border:1px solid #4f46e5;color:#a5b4fc;padding:13px 28px;font-family:'Cinzel',serif;font-size:12px;letter-spacing:2px;cursor:pointer;transition:all .3s;text-transform:uppercase;width:100%}
.sl-btn:hover{border-color:#818cf8;box-shadow:0 0 20px rgba(99,102,241,.4);color:#c7d2fe}
.sl-btn-sm{background:linear-gradient(135deg,#1e1b4b,#312e81);border:1px solid #4f46e5;color:#a5b4fc;padding:7px 14px;font-family:'Cinzel',serif;font-size:10px;letter-spacing:2px;cursor:pointer;transition:all .3s;text-transform:uppercase}
.sl-btn-sm:hover{border-color:#818cf8;box-shadow:0 0 12px rgba(99,102,241,.3);color:#c7d2fe}
.sl-btn-ghost{background:transparent;border:1px solid #1e293b;color:#475569;padding:10px 20px;font-family:'Cinzel',serif;font-size:11px;letter-spacing:2px;cursor:pointer;transition:all .3s;text-transform:uppercase}
.sl-btn-ghost:hover{border-color:#334155;color:#64748b}
.sl-inp{background:#0d1117;border:1px solid #1e293b;color:#e2e8f0;padding:13px 16px;font-family:'Rajdhani',sans-serif;font-size:15px;width:100%;outline:none;transition:all .3s;animation:borderPulse 3s infinite}
.sl-inp:focus{border-color:#4f46e5;box-shadow:0 0 14px rgba(79,70,229,.2);animation:none}
.sl-inp::placeholder{color:#475569}
.sl-qcard{background:linear-gradient(135deg,#0d1117,#0a0f1e);border:1px solid #1e293b;padding:16px;margin-bottom:10px;transition:all .3s;animation:slideUp .4s ease}
.sl-qcard:hover{border-color:#334155;transform:translateX(3px);box-shadow:-3px 0 18px rgba(79,70,229,.12)}
.sl-tab{background:none;border:none;cursor:pointer;font-family:'Rajdhani',sans-serif;font-size:11px;letter-spacing:2px;padding:10px 10px;transition:all .3s;text-transform:uppercase;border-bottom:2px solid transparent;white-space:nowrap}
.sl-tab.active{color:#818cf8;border-bottom-color:#4f46e5}
.sl-tab:not(.active){color:#334155}
.sl-tab:not(.active):hover{color:#475569}
.sl-excard{padding:12px 14px;margin-bottom:8px}
.sl-excard:last-child{margin-bottom:0}
.sl-confirm-overlay{position:fixed;inset:0;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;z-index:300;padding:20px}
`;

function ConfirmDialog({ message, onYes, onNo }) {
  return (
    <div className="sl-confirm-overlay">
      <div style={{ background: "#0d1117", border: "1px solid #4f46e5", padding: "28px 24px", maxWidth: 340, width: "100%", textAlign: "center" }}>
        <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 14, color: "#94a3b8", lineHeight: 1.7, marginBottom: 22 }}>{message}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="sl-btn-ghost" onClick={onNo} style={{ flex: 1 }}>İPTAL</button>
          <button className="sl-btn" onClick={onYes} style={{ flex: 1, background: "linear-gradient(135deg,#450a0a,#7f1d1d)", borderColor: "#ef4444", color: "#fca5a5" }}>EVET, SİL</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("intro");
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [profile, setProfile] = useState(null);
  const [quests, setQuests] = useState([]);
  const [completedQuests, setCompletedQuests] = useState([]);
  const [xp, setXp] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Analiz ediliyor...");
  const [levelUp, setLevelUp] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const [particles] = useState(() =>
    Array.from({ length: 18 }, (_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 2 + 0.5, dur: 6 + Math.random() * 8,
      delay: i * 0.4, hue: Math.random() > 0.5 ? 220 : 260,
      opacity: Math.random() * 0.4 + 0.2,
    }))
  );
  const [activeTab, setActiveTab] = useState("quests");
  const [hasSave, setHasSave] = useState(false);
  const [saveNotif, setSaveNotif] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [apiError, setApiError] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (loadMem()) setHasSave(true);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  useEffect(() => {
    if (!profile) return;
    saveMem({ profile, quests, completedQuests, xp, chatHistory });
    setSaveNotif(true);
    const t = setTimeout(() => setSaveNotif(false), 2000);
    return () => clearTimeout(t);
  }, [profile, quests, completedQuests, xp, chatHistory]);

  const loadGame = () => {
    const s = loadMem();
    if (!s) return;
    setProfile(s.profile);
    setQuests(s.quests || []);
    setCompletedQuests(s.completedQuests || []);
    setXp(s.xp || 0);
    setChatHistory(s.chatHistory || []);
    setScreen("profile");
  };

  const resetGame = () => setConfirmOpen(true);
  const doReset = () => {
    try { localStorage.removeItem(SAVE_KEY); } catch(e) {}
    setProfile(null); setQuests([]); setCompletedQuests([]);
    setXp(0); setChatHistory([]); setAnswers({}); setCurrentQ(0);
    setHasSave(false); setScreen("intro"); setConfirmOpen(false);
  };

  const showLevelUp = () => {
    setLevelUp(true);
    setTimeout(() => setLevelUp(false), 2500);
  };

  const runAssessment = async () => {
    setScreen("loading");
    setApiError("");
    const msgs = ["Biyometrik veriler taranıyor...", "Fiziksel kapasite hesaplanıyor...", "Savaşçı sınıfı belirleniyor...", "Profil oluşturuluyor..."];
    let i = 0;
    const iv = setInterval(() => setLoadingMsg(msgs[i++ % msgs.length]), 900);
    try {
      const result = await callClaude(
        `Sen Solo Leveling evrenindeki Avcı Değerlendirme Sistemi'sin. SADECE geçerli JSON döndür, başka hiçbir şey yazma, markdown kullanma.
Format: {"rank":"E/D/C/B/A/S/S+","title":"yaratıcı Türkçe unvan","stats":{"strength":0-100,"agility":0-100,"endurance":0-100,"vitality":0-100,"will":0-100,"perception":0-100,"balance":0-100},"analysis":"2-3 cümle dramatik Türkçe analiz","weakest":"stat_adi","strongest":"stat_adi"}`,
        `Şınav:${answers.pushup || 0} Mekik:${answers.situp || 0} Squat:${answers.squat || 0} Plank:${answers.plank || 0}sn Koşu:${answers.run || 0}dk Barfiks:${answers.pullup || 0}`
      );
      const clean = result.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setProfile(parsed);
      setHasSave(true);
      clearInterval(iv);
      await doLoadQuests(parsed, []);
      setScreen("profile");
    } catch (err) {
      clearInterval(iv);
      setApiError("API hatası: " + (err.message || "Bilinmeyen hata"));
      setScreen("assessment");
    }
  };

  const doLoadQuests = async (prof, done) => {
    setLoading(true);
    try {
      const result = await callClaude(
        `Sen Solo Leveling Görev Sistemi'sin. SADECE geçerli JSON döndür, markdown kullanma.
Format: {"quests":[{"id":"uid_1","title":"başlık","description":"kısa açıklama","task":"net talimat","xp":50-200,"difficulty":"KOLAY/ORTA/ZOR","category":"güç/dayanıklılık/çeviklik/irade/meditasyon/denge/duyular"}]}
Kategoriler: güç, dayanıklılık, çeviklik, irade, meditasyon, denge, duyular.
Her seferinde farklı kategorilerden 4 görev oluştur. id alanları benzersiz olmalı.`,
        `Rütbe:${prof.rank} Unvan:${prof.title} Zayıf:${prof.weakest} Güçlü:${prof.strongest} Stats:${JSON.stringify(prof.stats)} Tamamlanan:${done.slice(-5).join(",") || "Yok"}`
      );
      const clean = result.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setQuests(parsed.quests || []);
    } catch (err) {
      setApiError("Görev yükleme hatası: " + (err.message || "Bilinmeyen hata"));
    }
    setLoading(false);
  };

  const completeQuest = async (quest) => {
    const done = [...completedQuests, quest.title];
    setCompletedQuests(done);
    setXp(x => x + quest.xp);
    showLevelUp();
    const rem = quests.filter(q => q.id !== quest.id);
    setQuests(rem);
    if (rem.length === 0) await doLoadQuests(profile, done);
  };

  const completeStaticQuest = (xpReward) => {
    setXp(x => x + xpReward);
    showLevelUp();
  };

  const askAI = async () => {
    if (!inputVal.trim() || loading) return;
    const msg = inputVal.trim();
    setInputVal("");
    const newHist = [...chatHistory, { role: "user", content: msg }];
    setChatHistory(newHist);
    setLoading(true);
    try {
      const reply = await callClaude(
        `Solo Leveling sisteminin rehber AI'ısın. Kısa, motive edici Türkçe cevaplar ver. Maks 3 cümle. Dramatik ve güçlü ol. Meditasyon, denge ve duyular konularında da rehberlik edebilirsin. Avcı: ${profile?.rank} rütbeli, "${profile?.title}", ${xp} XP.`,
        msg,
        chatHistory.slice(-6)
      );
      setChatHistory([...newHist, { role: "assistant", content: reply }]);
    } catch {
      setChatHistory([...newHist, { role: "assistant", content: "Sistem geçici olarak bağlanamıyor. Tekrar dene." }]);
    }
    setLoading(false);
  };

  const rc = profile ? (RANK_COLORS[profile.rank] || "#6b7280") : "#6b7280";
  const rg = profile ? (RANK_GLOWS[profile.rank] || "rgba(107,114,128,0.3)") : "rgba(107,114,128,0.3)";
  const xpThreshold = 500;
  const xpProgress = (xp % xpThreshold) / xpThreshold * 100;
  const currentLevel = Math.floor(xp / xpThreshold) + 1;

  const advanceQ = () => {
    const v = answers[QUESTIONS[currentQ].id];
    if (!v && v !== "0" && v !== 0) return;
    if (currentQ < QUESTIONS.length - 1) setCurrentQ(q => q + 1);
    else runAssessment();
  };

  return (
    <div style={{ minHeight: "100vh", background: "#050810", color: "#e2e8f0", fontFamily: "'Cinzel',Georgia,serif", position: "relative", overflowX: "hidden" }}>
      <style>{STYLES}</style>

      {confirmOpen && (
        <ConfirmDialog
          message="Tüm ilerleme silinecek ve sıfırdan başlayacaksın. Emin misin?"
          onYes={doReset}
          onNo={() => setConfirmOpen(false)}
        />
      )}

      {/* Particles */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        {particles.map(p => (
          <div key={p.id} style={{ position: "absolute", left: `${p.x}%`, top: `${p.y}%`, width: `${p.size}px`, height: `${p.size}px`, borderRadius: "50%", background: `hsla(${p.hue},80%,70%,${p.opacity})`, boxShadow: `0 0 ${p.size * 4}px hsla(${p.hue},80%,70%,.3)`, animation: `pFloat ${p.dur}s ${p.delay}s ease-in-out infinite` }} />
        ))}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(79,70,229,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(79,70,229,.025) 1px,transparent 1px)", backgroundSize: "50px 50px" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center,transparent 40%,rgba(5,8,16,.85) 100%)" }} />
      </div>

      {saveNotif && (
        <div style={{ position: "fixed", top: 14, right: 14, zIndex: 200, background: "#0d1117", border: "1px solid #10b981", padding: "7px 13px", fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: "#10b981", letterSpacing: 2, animation: "saveFlash 2s ease forwards" }}>✓ KAYDEDİLDİ</div>
      )}

      {apiError && (
        <div style={{ position: "fixed", top: 14, left: "50%", transform: "translateX(-50%)", zIndex: 200, background: "#1a0a0a", border: "1px solid #ef4444", padding: "8px 16px", fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: "#fca5a5", letterSpacing: 1, maxWidth: "90vw", textAlign: "center" }}>
          ⚠ {apiError}
          <button onClick={() => setApiError("")} style={{ background: "none", border: "none", color: "#ef4444", marginLeft: 10, cursor: "pointer", fontSize: 14 }}>×</button>
        </div>
      )}

      {levelUp && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: "clamp(20px,5vw,50px)", fontWeight: 900, color: "#fbbf24", textShadow: "0 0 40px rgba(251,191,36,.8)", animation: "lvlUp 2.2s ease-out forwards", letterSpacing: 3, textAlign: "center", padding: "0 20px" }}>⚡ TAMAMLANDI ⚡</div>
        </div>
      )}

      <div style={{ position: "relative", zIndex: 1, maxWidth: 640, margin: "0 auto", padding: "20px 16px", minHeight: "100vh" }}>
        {screen === "intro" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", textAlign: "center" }}>
            <div style={{ animation: "float 4s ease-in-out infinite", fontSize: 72, marginBottom: 12, filter: "drop-shadow(0 0 20px rgba(99,102,241,.7))" }}>⚔️</div>
            <div style={{ fontSize: 10, letterSpacing: 6, color: "#475569", fontFamily: "'Rajdhani',sans-serif", marginBottom: 12 }}>HUNTER ASSOCIATION SYSTEM</div>
            <h1 style={{ fontSize: "clamp(28px,8vw,54px)", fontWeight: 900, background: "linear-gradient(135deg,#c7d2fe,#818cf8,#6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.1, marginBottom: 8 }}>SOLO LEVELING</h1>
            <div style={{ fontSize: "clamp(11px,3vw,16px)", color: "#64748b", fontFamily: "'Rajdhani',sans-serif", fontWeight: 600, letterSpacing: 3, marginBottom: 36 }}>HUNTER SYSTEM v2.1</div>
            <div style={{ background: "linear-gradient(135deg,rgba(30,27,75,.5),rgba(15,23,42,.8))", border: "1px solid #1e293b", padding: "18px 22px", marginBottom: 24, maxWidth: 400, fontFamily: "'Rajdhani',sans-serif", fontSize: 13, color: "#64748b", lineHeight: 1.8 }}>
              "Sistemin gözü seni seçti. Fiziksel durumun analiz edilecek, sınıfın belirlenecek ve yükseliş yolculuğun başlayacak."
            </div>
            <button className="sl-btn" onClick={() => setScreen("assessment")} style={{ maxWidth: 300, fontSize: 12, padding: "14px 28px", marginBottom: 10 }}>◆ DEĞERLENDİRMEYE BAŞLA ◆</button>
            {hasSave && <button className="sl-btn-ghost" onClick={loadGame} style={{ maxWidth: 300 }}>↺ KAYDI YÜKLE</button>}
          </div>
        )}

        {screen === "assessment" && (
          <div style={{ paddingTop: 40 }}>
            <div style={{ textAlign: "center", marginBottom: 30 }}>
              <div style={{ fontSize: 10, letterSpacing: 5, color: "#4f46e5", fontFamily: "'Rajdhani',sans-serif", marginBottom: 8 }}>HUNTER EVALUATION — {currentQ + 1}/{QUESTIONS.length}</div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#c7d2fe" }}>Fiziksel Değerlendirme</h2>
              <div style={{ height: 2, marginTop: 12, background: `linear-gradient(to right,#4f46e5 ${(currentQ / QUESTIONS.length) * 100}%,#1e293b ${(currentQ / QUESTIONS.length) * 100}%)`, transition: "all .5s" }} />
            </div>
            <div style={{ background: "linear-gradient(135deg,#0d1117,#0a0f1e)", border: "1px solid #1e293b", padding: "24px 20px", animation: "slideUp .4s ease" }}>
              <div style={{ fontSize: 10, letterSpacing: 4, color: "#4f46e5", fontFamily: "'Rajdhani',sans-serif", marginBottom: 10 }}>[{QUESTIONS[currentQ].label.toUpperCase()}]</div>
              <div style={{ fontSize: "clamp(15px,4vw,20px)", color: "#e2e8f0", marginBottom: 20, lineHeight: 1.5, fontWeight: 600 }}>{QUESTIONS[currentQ].question}</div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14 }}>
                <input
                  type="number" min="0" className="sl-inp"
                  placeholder={`${QUESTIONS[currentQ].unit} gir...`}
                  value={answers[QUESTIONS[currentQ].id] || ""}
                  onChange={e => setAnswers(p => ({ ...p, [QUESTIONS[currentQ].id]: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && advanceQ()}
                  style={{ flex: 1 }}
                />
                <span style={{ color: "#475569", fontFamily: "'Rajdhani',sans-serif", fontSize: 12, whiteSpace: "nowrap" }}>{QUESTIONS[currentQ].unit}</span>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {currentQ > 0 && (
                  <button className="sl-btn" onClick={() => setCurrentQ(q => q - 1)} style={{ flex: 1, background: "transparent", borderColor: "#1e293b", color: "#475569", fontSize: 11 }}>← GERİ</button>
                )}
                <button className="sl-btn" style={{ flex: 2, fontSize: 11 }} onClick={advanceQ}>
                  {currentQ < QUESTIONS.length - 1 ? "İLERİ →" : "◆ ANALİZ ET ◆"}
                </button>
              </div>
            </div>
          </div>
        )}

        {screen === "loading" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
            <div style={{ position: "relative", width: 100, height: 100, marginBottom: 30 }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid transparent", borderTopColor: "#4f46e5", animation: "spin 1s linear infinite" }} />
              <div style={{ position: "absolute", inset: 6, borderRadius: "50%", border: "2px solid transparent", borderBottomColor: "#7c3aed", animation: "spinR 1.5s linear infinite" }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>⚔️</div>
            </div>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12, letterSpacing: 3, color: "#64748b", textTransform: "uppercase" }}>{loadingMsg}</div>
          </div>
        )}

        {screen === "profile" && profile && (
          <div style={{ paddingTop: 14, animation: "slideUp .5s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 10, letterSpacing: 4, color: "#334155", fontFamily: "'Rajdhani',sans-serif" }}>HUNTER PROFILE</div>
              <button className="sl-btn-ghost" onClick={resetGame} style={{ fontSize: 10, padding: "6px 12px" }}>↺ SIFIRLA</button>
            </div>
            <div style={{ background: "linear-gradient(135deg,#0d1117,#0a0f1e)", border: `1px solid ${rc}`, boxShadow: `0 0 32px ${rg}`, padding: "20px 18px", marginBottom: 10, display: "flex", alignItems: "center", gap: 16, animation: "rankIn .8s cubic-bezier(.34,1.56,.64,1)" }}>
              <div style={{ minWidth: 68, height: 68, border: `2px solid ${rc}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 22px ${rg}`, background: `radial-gradient(circle,${rc}15,transparent)`, flexShrink: 0 }}>
                <span style={{ fontSize: 30, fontWeight: 900, color: rc, textShadow: `0 0 16px ${rc}`, fontFamily: "'Cinzel',serif" }}>{profile.rank}</span>
              </div>
              <div>
                <div style={{ fontSize: 10, letterSpacing: 4, color: rc, fontFamily: "'Rajdhani',sans-serif", marginBottom: 4 }}>◆ AVCI SINIFI</div>
                <div style={{ fontSize: "clamp(13px,3.5vw,18px)", fontWeight: 700, color: "#e2e8f0", lineHeight: 1.3 }}>{profile.title}</div>
              </div>
            </div>
            <div style={{ background: "#0a0f1a", border: "1px solid #1e293b", padding: "11px 14px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, letterSpacing: 3, color: "#475569" }}>SEVİYE {currentLevel}</span>
                <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: "#fbbf24", fontWeight: 700 }}>⚡ {xp} XP</span>
              </div>
              <div style={{ height: 5, background: "#1e293b", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${xpProgress}%`, background: "linear-gradient(to right,#a16207,#fbbf24)", borderRadius: 3, transition: "width .8s ease" }} />
              </div>
            </div>
            <div style={{ background: "#0a0f1a", border: "1px solid #1e293b", padding: "12px 15px", marginBottom: 10, fontFamily: "'Rajdhani',sans-serif", fontSize: 13, color: "#64748b", lineHeight: 1.7, fontStyle: "italic" }}>
              "{profile.analysis}"
            </div>
            <div style={{ background: "linear-gradient(135deg,#0d1117,#0a0f1e)", border: "1px solid #1e293b", padding: "16px", marginBottom: 14 }}>
              <div style={{ fontSize: 10, letterSpacing: 4, color: "#4f46e5", fontFamily: "'Rajdhani',sans-serif", marginBottom: 14 }}>◆ İSTATİSTİKLER</div>
              {Object.entries(profile.stats).map(([k, v]) => {
                const lb = { strength: "GÜÇ", agility: "ÇEVİKLİK", endurance: "DAYANIKLILIK", vitality: "CANLILIK", will: "İRADE", perception: "ALGI", balance: "DENGE" };
                const cl = { strength: "#ef4444", agility: "#3b82f6", endurance: "#10b981", vitality: "#f59e0b", will: "#8b5cf6", perception: "#ec4899", balance: "#06b6d4" };
                if (!lb[k]) return null;
                return (
                  <div key={k} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, letterSpacing: 2, color: "#475569" }}>{lb[k]}</span>
                      <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, fontWeight: 700, color: cl[k] }}>{v}</span>
                    </div>
                    <div style={{ height: 5, background: "#1e293b", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(v, 100)}%`, borderRadius: 3, background: cl[k], transition: "width 1.5s cubic-bezier(.4,0,.2,1)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <button className="sl-btn" onClick={() => { setScreen("quest"); setActiveTab("quests"); }}>◆ GÖREV PANOSUNU AÇ ◆</button>
          </div>
        )}

        {screen === "quest" && profile && (
          <div style={{ paddingTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <button onClick={() => setScreen("profile")} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontFamily: "'Rajdhani',sans-serif", fontSize: 12, letterSpacing: 2 }}>← PROFİL</button>
              <div style={{ color: "#fbbf24", fontFamily: "'Rajdhani',sans-serif", fontSize: 12 }}>⚡ {xp}</div>
            </div>
            <div style={{ display: "flex", borderBottom: "1px solid #1e293b", marginBottom: 18, overflowX: "auto" }}>
              {[{ id: "quests", label: "⚔️ GÖREVLER" }, { id: "mind", label: "🧘 ZİHİN" }, { id: "chat", label: "🔮 REHBERİ" }, { id: "history", label: "📜 GEÇMİŞ" }].map(t => (
                <button key={t.id} className={`sl-tab ${activeTab === t.id ? "active" : ""}`} onClick={() => setActiveTab(t.id)}>{t.label}</button>
              ))}
            </div>

            {activeTab === "quests" && (
              <div>
                {quests.map((q, i) => {
                  const cat = CATEGORY_INFO[q.category] || { icon: "◆", color: "#64748b" };
                  return (
                    <div key={q.id || i} className="sl-qcard">
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <span style={{ fontSize: 15 }}>{cat.icon}</span>
                          <span style={{ fontSize: 9, color: cat.color }}>{(q.category || "").toUpperCase()}</span>
                        </div>
                        <span style={{ color: "#fbbf24", fontSize: 11 }}>+{q.xp} XP</span>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>{q.title}</div>
                      <div style={{ background: "#0d1117", padding: "8px", marginTop: "8px", fontSize: 12, color: "#94a3b8" }}>{q.task}</div>
                      <button className="sl-btn" style={{ marginTop: "10px", padding: "8px" }} onClick={() => completeQuest(q)}>TAMAMLANDI</button>
                    </div>
                  );
                })}
              </div>
            )}
            
            {activeTab === "chat" && (
              <div style={{ background: "#0d1117", border: "1px solid #1e293b", padding: 16 }}>
                <div style={{ maxHeight: 300, overflowY: "auto", marginBottom: 10 }}>
                  {chatHistory.map((m, i) => (
                    <div key={i} style={{ marginBottom: 10, padding: 8, background: "#0f172a", border: "1px solid #1e293b", fontSize: 13 }}>
                      <div style={{ fontSize: 9, color: "#4f46e5" }}>{m.role === "user" ? "SEN" : "SİSTEM"}</div>
                      {m.content}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input className="sl-inp" value={inputVal} onChange={e => setInputVal(e.target.value)} onKeyDown={e => e.key === "Enter" && askAI()} placeholder="Sisteme sor..." />
                  <button className="sl-btn" onClick={askAI} style={{ width: "auto" }}>GÖNDER</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}