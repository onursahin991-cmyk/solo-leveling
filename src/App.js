import { useState, useEffect } from "react";

const RANK_COLORS = { "E": "#6b7280", "D": "#10b981", "C": "#3b82f6", "B": "#8b5cf6", "A": "#f59e0b", "S": "#ef4444", "S+": "#ff6b35" };

const QUESTIONS = [
  { id: "pushup", label: "Şınav", question: "Kaç şınav çekebiliyorsun?", unit: "tekrar" },
  { id: "situp", label: "Mekik", question: "Kaç mekik yapabiliyorsun?", unit: "tekrar" },
  { id: "squat", label: "Squat", question: "Kaç squat yapabiliyorsun?", unit: "tekrar" },
  { id: "plank", label: "Plank", question: "Kaç saniye plank tutabiliyorsun?", unit: "saniye" },
  { id: "run", label: "Koşu", question: "Hiç durmadan kaç dakika koşabiliyorsun?", unit: "dakika" },
  { id: "pullup", label: "Barfiks", question: "Kaç barfiks çekebiliyorsun?", unit: "tekrar" },
];

const STYLES = `
body{background:#050810;color:#e2e8f0;font-family:sans-serif;margin:0}
.sl-btn{background:linear-gradient(135deg,#1e1b4b,#312e81);border:1px solid #4f46e5;color:#a5b4fc;padding:12px;cursor:pointer;width:100%;font-weight:bold}
.sl-inp{background:#0d1117;border:1px solid #1e293b;color:#fff;padding:12px;width:100%;margin-bottom:15px;font-size:16px}
`;

export default function App() {
  const [screen, setScreen] = useState("intro");
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorLog, setErrorLog] = useState("");

  const callAI = async (prompt, data) => {
    // Vercel'deki değişkenin başına REACT_APP_ eklediğinden emin ol
    const key = process.env.REACT_APP_GEMINI_KEY;
    
    if (!key) throw new Error("API Anahtarı bulunamadı. Vercel ayarlarını kontrol et.");

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt + "\n Veriler: " + data }] }] })
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || "API yanıt vermedi.");
    
    let text = json.candidates[0].content.parts[0].text;
    // Markdown temizliği
    return text.replace(/```json|```/g, "").trim();
  };

  const runAssessment = async () => {
    setLoading(true);
    setErrorLog("");
    try {
      const prompt = "Sen Solo Leveling sistemisin. SADECE JSON döndür, açıklama yapma: {\"rank\":\"E\",\"title\":\"Avcı\",\"stats\":{\"strength\":10},\"analysis\":\"Analiz mesajı\"}";
      const result = await callAI(prompt, JSON.stringify(answers));
      const parsed = JSON.parse(result);
      setProfile(parsed);
      setScreen("profile");
    } catch (e) {
      console.error(e);
      setErrorLog(e.message);
    }
    setLoading(false);
  };

  const advanceQ = () => {
    if (currentQ < QUESTIONS.length - 1) setCurrentQ(currentQ + 1);
    else runAssessment();
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 20 }}>
      <style>{STYLES}</style>
      
      {screen === "intro" && (
        <div style={{ textAlign: "center", marginTop: "20vh" }}>
          <h1>SOLO LEVELING</h1>
          <button className="sl-btn" onClick={() => setScreen("assessment")}>SİSTEMİ BAŞLAT</button>
        </div>
      )}

      {screen === "assessment" && !loading && (
        <div>
          <h2>{QUESTIONS[currentQ].question}</h2>
          <input type="number" className="sl-inp" autoFocus onChange={e => setAnswers({...answers, [QUESTIONS[currentQ].id]: e.target.value})} onKeyDown={e => e.key === "Enter" && advanceQ()} />
          <button className="sl-btn" onClick={advanceQ}>İLERLE</button>
        </div>
      )}

      {loading && <div style={{ textAlign: "center", marginTop: "20vh" }}>SİSTEM ANALİZ EDİYOR...</div>}

      {errorLog && (
        <div style={{ color: "#ef4444", background: "#1a1010", padding: 10, marginTop: 20, fontSize: 12 }}>
          <strong>Hata Kaydı:</strong> {errorLog}
          <br/> Vercel Environment Variables kısmını ve Key ismini kontrol edin.
        </div>
      )}

      {screen === "profile" && profile && (
        <div style={{ textAlign: "center", border: `2px solid ${RANK_COLORS[profile.rank] || "#fff"}`, padding: 20 }}>
          <h2 style={{ color: RANK_COLORS[profile.rank] }}>{profile.rank} SINIFI</h2>
          <h1>{profile.title}</h1>
          <p>{profile.analysis}</p>
          <button className="sl-btn" onClick={() => window.location.reload()}>TEKRARLA</button>
        </div>
      )}
    </div>
  );
}