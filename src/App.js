import { useState, useEffect, useRef } from "react";

const RANK_COLORS = { "E": "#6b7280", "D": "#10b981", "C": "#3b82f6", "B": "#8b5cf6", "A": "#f59e0b", "S": "#ef4444", "S+": "#ff6b35" };
const RANK_GLOWS = { "E": "rgba(107,114,128,0.35)", "D": "rgba(16,185,129,0.35)", "C": "rgba(59,130,246,0.35)", "B": "rgba(139,92,246,0.35)", "A": "rgba(245,158,11,0.4)", "S": "rgba(239,68,68,0.5)", "S+": "rgba(255,107,53,0.6)" };

const QUESTIONS = [
  { id: "pushup", label: "Şınav", question: "Kaç şınav çekebiliyorsun?", unit: "tekrar" },
  { id: "situp", label: "Mekik", question: "Kaç mekik yapabiliyorsun?", unit: "tekrar" },
  { id: "squat", label: "Squat", question: "Kaç squat yapabiliyorsun?", unit: "tekrar" },
  { id: "plank", label: "Plank", question: "Kaç saniye plank tutabiliyorsun?", unit: "saniye" },
  { id: "run", label: "Koşu", question: "Hiç durmadan kaç dakika koşabiliyorsun?", unit: "dakika" },
  { id: "pullup", label: "Barfiks", question: "Kaç barfiks çekebiliyorsun?", unit: "tekrar" },
];

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Rajdhani:wght@600&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{background:#050810;color:#e2e8f0;font-family:'Rajdhani',sans-serif}
.sl-btn{background:linear-gradient(135deg,#1e1b4b,#312e81);border:1px solid #4f46e5;color:#a5b4fc;padding:12px;cursor:pointer;width:100%;font-family:'Cinzel',serif}
.sl-inp{background:#0d1117;border:1px solid #1e293b;color:#fff;padding:12px;width:100%;margin-bottom:15px}
.sl-qcard{background:#0d1117;border:1px solid #1e293b;padding:15px;margin-bottom:10px}
`;

export default function App() {
  const [screen, setScreen] = useState("intro");
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  const callAI = async (prompt, data) => {
    const key = process.env.REACT_APP_GEMINI_KEY;
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt + "\n" + data }] }] })
    });
    const json = await res.json();
    return json.candidates[0].content.parts[0].text;
  };

  const runAssessment = async () => {
    setLoading(true);
    try {
      const prompt = "Sen Solo Leveling sistemisin. SADECE JSON döndür: {\"rank\":\"E\",\"title\":\"E-Sınıfı Avcı\",\"stats\":{\"strength\":10},\"analysis\":\"Zayıf ama potansiyelli.\"}";
      const userData = JSON.stringify(answers);
      const result = await callAI(prompt, userData);
      setProfile(JSON.parse(result.replace(/```json|```/g, "")));
      setScreen("profile");
    } catch (e) { alert("Hata: " + e.message); }
    setLoading(false);
  };

  const advanceQ = () => {
    if (currentQ < QUESTIONS.length - 1) setCurrentQ(currentQ + 1);
    else runAssessment();
  };

  return (
    <div style={{ maxWidth: 500, margin: "auto", padding: 20 }}>
      <style>{STYLES}</style>
      
      {screen === "intro" && (
        <div style={{ textAlign: "center", marginTop: "20vh" }}>
          <h1 style={{ fontFamily: "Cinzel", fontSize: "2.5rem" }}>SOLO LEVELING</h1>
          <button className="sl-btn" onClick={() => setScreen("assessment")}>SİSTEME BAŞLA</button>
        </div>
      )}

      {screen === "assessment" && (
        <div>
          <h2 style={{ marginBottom: 20 }}>{QUESTIONS[currentQ].question}</h2>
          <input 
            type="number" className="sl-inp" autoFocus
            onChange={e => setAnswers({...answers, [QUESTIONS[currentQ].id]: e.target.value})}
            onKeyDown={e => e.key === "Enter" && advanceQ()}
          />
          <button className="sl-btn" onClick={advanceQ}>DEVAM ET</button>
        </div>
      )}

      {loading && <div style={{ textAlign: "center", marginTop: "20vh" }}>SİSTEM ANALİZ EDİYOR...</div>}

      {screen === "profile" && profile && (
        <div style={{ textAlign: "center", border: `2px solid ${RANK_COLORS[profile.rank]}`, padding: 20 }}>
          <h2 style={{ color: RANK_COLORS[profile.rank] }}>{profile.rank} SINIFI</h2>
          <h1>{profile.title}</h1>
          <p style={{ marginTop: 15, opacity: 0.7 }}>{profile.analysis}</p>
          <button className="sl-btn" style={{ marginTop: 20 }} onClick={() => window.location.reload()}>YENİDEN BAŞLA</button>
        </div>
      )}
    </div>
  );
}