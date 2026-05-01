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

const callClaude = async (system, userMsg, history = []) => {
  // Vercel Environment Variable kullanımı:
  const apiKey = process.env.REACT_APP_GEMINI_KEY;
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        ...history.map(h => ({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.content }]
        })),
        {
          role: "user",
          parts: [{ text: `${system}\n\nVeri: ${userMsg}` }]
        }
      ]
    })
  });

  if (!res.ok) throw new Error(`API Hatası: ${res.status}`);
  const data = await res.json();
  if (!data.candidates || !data.candidates[0]) throw new Error("Boş yanıt");
  return data.candidates[0].content.parts[0].text;
};

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
      const prompt = "Sen Solo Leveling evrenindeki Avcı Değerlendirme Sistemi'sin. SADECE geçerli JSON döndür, başka hiçbir şey yazma, markdown kullanma. Format: {\"rank\":\"E/D/C/B/A/S/S+\",\"title\":\"unvan\",\"stats\":{\"strength\":0-100,\"agility\":0-100,\"endurance\":0-100,\"vitality\":0-100,\"will\":0-100,\"perception\":0-100,\"balance\":0-100},\"analysis\":\"analiz\",\"weakest\":\"stat\",\"strongest\":\"stat\"}";
      const userData = `Şınav:${answers.pushup || 0} Mekik:${answers.situp || 0} Squat:${answers.squat || 0} Plank:${answers.plank || 0}sn Koşu:${answers.run || 0}dk Barfiks:${answers.pullup || 0}`;
      
      const result = await callClaude(prompt, userData);
      const clean = result.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setProfile(parsed);
      setHasSave(true);
      clearInterval(iv);
      await doLoadQuests(parsed, []);
      setScreen("profile");
    } catch (err) {
      clearInterval(iv);
      setApiError("Analiz Hatası: " + err.message);
      setScreen("assessment");
    }
  };

  const doLoadQuests = async (prof, done) => {
    setLoading(true);
    try {
      const prompt = "Sen Solo Leveling Görev Sistemi'sin. SADECE geçerli JSON döndür. Format: {\"quests\":[{\"id\":\"uid\",\"title\":\"başlık\",\"description\":\"açıklama\",\"task\":\"görev\",\"xp\":50,\"difficulty\":\"KOLAY\",\"category\":\"güç\"}]}";
      const status = `Rütbe:${prof.rank} Stats:${JSON.stringify(prof.stats)} Tamamlanan:${done.slice(-5).join(",") || "Yok"}`;
      
      const result = await callClaude(prompt, status);
      const clean = result.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setQuests(parsed.quests || []);
    } catch (err) {
      setApiError("Görev Hatası: " + err.message);
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
        `Solo Leveling rehber AI. Avcı: ${profile?.rank} rütbeli, ${profile?.title}.`,
        msg,
        chatHistory.slice(-6)
      );
      setChatHistory([...newHist, { role: "assistant", content: reply }]);
    } catch {
      setChatHistory([...newHist, { role: "assistant", content: "Bağlantı hatası." }]);
    }
    setLoading(false);
  };

  const rc = profile ? (RANK_COLORS[profile.rank] || "#6b7280") : "#6b7280";
  const rg = profile ? (RANK_GLOWS[profile.rank] || "rgba(107,114,128,0.3)") : "rgba(107,114,128,0.3)";
  const xpThreshold = 500;
  const currentLevel = Math.floor(xp / xpThreshold) + 1;

  const advanceQ = () => {
    const v = answers[QUESTIONS[currentQ].id];
    if (!v && v !== "0" && v !== 0) return;
    if (currentQ < QUESTIONS.length - 1) setCurrentQ(q => q + 1);
    else runAssessment();
  };

  return (
    <div style={{ minHeight: "100vh", background: "#050810", color: "#e2e8f0", fontFamily: "'Cinzel',serif", position: "relative", overflowX: "hidden" }}>
      <style>{STYLES}</style>
      {confirmOpen && <ConfirmDialog message="Sıfırlansın mı?" onYes={doReset} onNo={() => setConfirmOpen(false)} />}
      
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        {particles.map(p => (
          <div key={p.id} style={{ position: "absolute", left: `${p.x}%`, top: `${p.y}%`, width: `${p.size}px`, height: `${p.size}px`, borderRadius: "50%", background: `hsla(${p.hue},80%,70%,${p.opacity})`, animation: `pFloat ${p.dur}s ${p.delay}s infinite` }} />
        ))}
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 640, margin: "0 auto", padding: "20px 16px" }}>
        {screen === "intro" && (
          <div style={{ textAlign: "center", paddingTop: "20vh" }}>
            <h1 style={{ fontSize: "3rem", marginBottom: "1rem" }}>SOLO LEVELING</h1>
            <button className="sl-btn" onClick={() => setScreen("assessment")}>SİSTEME GİRİŞ</button>
            {hasSave && <button className="sl-btn-ghost" onClick={loadGame} style={{ marginTop: "1rem" }}>KAYDI YÜKLE</button>}
          </div>
        )}

        {screen === "assessment" && (
          <div>
            <h2>{QUESTIONS[currentQ].question}</h2>
            <input 
              type="number" 
              className="sl-inp" 
              value={answers[QUESTIONS[currentQ].id] || ""} 
              onChange={e => setAnswers({...answers, [QUESTIONS[currentQ].id]: e.target.value})}
              onKeyDown={e => e.key === "Enter" && advanceQ()}
            />
            <button className="sl-btn" style={{ marginTop: "1rem" }} onClick={advanceQ}>DEVAM ET</button>
          </div>
        )}

        {screen === "loading" && <div style={{ textAlign: "center", paddingTop: "30vh" }}>{loadingMsg}</div>}

        {screen === "profile" && profile && (
          <div>
            <div style={{ border: `1px solid ${rc}`, padding: "20px", boxShadow: `0 0 20px ${rg}` }}>
              <h3>{profile.rank} SINIFI</h3>
              <h1>{profile.title}</h1>
            </div>
            <button className="sl-btn" style={{ marginTop: "1rem" }} onClick={() => setScreen("quest")}>GÖREVLER</button>
          </div>
        )}

        {screen === "quest" && (
          <div>
            <button className="sl-btn-ghost" onClick={() => setScreen("profile")}>GERİ</button>
            {quests.map(q => (
              <div key={q.id} className="sl-qcard">
                <h4>{q.title}</h4>
                <p>{q.task}</p>
                <button className="sl-btn" onClick={() => completeQuest(q)}>TAMAMLANDI</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}