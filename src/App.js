import { useState } from "react";

const RANK_COLORS = { "E": "#6b7280", "D": "#10b981", "C": "#3b82f6", "B": "#8b5cf6", "A": "#f59e0b", "S": "#ef4444", "S+": "#ff6b35" };

export default function App() {
  const [screen, setScreen] = useState("intro");
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const callAI = async (prompt, data) => {
    // Vercel'den gelen anahtarı kontrol ediyoruz
    const key = process.env.REACT_APP_GEMINI_KEY;
    
    if (!key || key.length < 5) {
      throw new Error("Sistem Hatası: API Anahtarı boş veya okunmuyor. Lütfen Vercel'de Redeploy yapın.");
    }

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt + "\n Veriler: " + data }] }] })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Google sunucusu yanıt vermedi.");
      
      const text = json.candidates[0].content.parts[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return jsonMatch ? jsonMatch[0] : text;
    } catch (e) {
      throw new Error("Bağlantı Sorunu: " + e.message);
    }
  };

  const runAssessment = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const prompt = "SADECE JSON döndür: {\"rank\":\"E\",\"title\":\"Avcı\",\"stats\":{\"strength\":10},\"analysis\":\"analiz\"}";
      const result = await callAI(prompt, JSON.stringify(answers));
      setProfile(JSON.parse(result.replace(/```json|```/g, "")));
      setScreen("profile");
    } catch (e) {
      setErrorMsg(e.message);
    }
    setLoading(false);
  };

  const advanceQ = () => {
    if (currentQ < 5) setCurrentQ(currentQ + 1); // Toplam 6 soru (0-5)
    else runAssessment();
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 20, color: "#fff", fontFamily: "sans-serif" }}>
      <style>{`body{background:#050810} .btn{background:#4f46e5; color:#fff; padding:12px; width:100%; border:none; cursor:pointer; margin-top:20px; font-weight:bold}`}</style>
      
      {screen === "intro" && (
        <div style={{ textAlign: "center", marginTop: "20vh" }}>
          <h1>SOLO LEVELING</h1>
          <button className="btn" onClick={() => setScreen("assessment")}>SİSTEMİ BAŞLAT</button>
        </div>
      )}

      {screen === "assessment" && !loading && (
        <div>
          <h2>Soru {currentQ + 1}</h2>
          <input type="number" style={{ width: "100%", padding: 12, background: "#0d1117", color: "#fff", border: "1px solid #1e293b" }} 
            onChange={e => setAnswers({...answers, [currentQ]: e.target.value})} 
            onKeyDown={e => e.key === "Enter" && advanceQ()} />
          <button className="btn" onClick={advanceQ}>İLERLE</button>
        </div>
      )}

      {loading && <div style={{ textAlign: "center", marginTop: "30vh" }}>SİSTEM ANALİZ EDİYOR...</div>}
      
      {errorMsg && (
        <div style={{ color: "#ff4444", marginTop: 20, padding: 15, background: "#1a1010", border: "1px solid red", fontSize: "12px" }}>
          <strong>DURUM:</strong> {errorMsg}
        </div>
      )}

      {screen === "profile" && profile && (
        <div style={{ textAlign: "center", border: `2px solid ${RANK_COLORS[profile.rank]}`, padding: 20 }}>
          <h1 style={{ color: RANK_COLORS[profile.rank] }}>{profile.rank} SINIFI</h1>
          <h2>{profile.title}</h2>
          <p>{profile.analysis}</p>
          <button className="btn" onClick={() => window.location.reload()}>YENİDEN DENE</button>
        </div>
      )}
    </div>
  );
}