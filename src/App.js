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

export default function App() {
  const [screen, setScreen] = useState("intro");
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const callAI = async (prompt, data) => {
    const key = process.env.REACT_APP_GEMINI_KEY;
    if (!key) throw new Error("API KEY EKSİK! Vercel ayarlarını kontrol et.");

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt + "\n Veriler: " + data }] }] })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Google sunucusu hata döndürdü.");
      
      let text = json.candidates[0].content.parts[0].text;
      
      // JSON'u metinden ayıklama (En kritik kısım burası!)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return jsonMatch[0];
      
      return text;
    } catch (e) {
      throw new Error("Bağlantı Hatası: " + e.message);
    }
  };

  const runAssessment = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const prompt = "Sen Solo Leveling sistemisin. SADECE JSON formatında şu yapıyı döndür, asla başka yazı yazma: {\"rank\":\"E\",\"title\":\"İsimsiz Avcı\",\"stats\":{\"strength\":10},\"analysis\":\"Analiz raporu.\"}";
      const result = await callAI(prompt, JSON.stringify(answers));
      
      // Gelen veriyi temizle ve parse et
      const cleanJson = result.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      
      setProfile(parsed);
      setScreen("profile");
    } catch (e) {
      setErrorMsg("Sistem Hatası: " + e.message);
    }
    setLoading(false);
  };

  const advanceQ = () => {
    const val = answers[QUESTIONS[currentQ].id];
    if (!val && val !== 0) return;
    if (currentQ < QUESTIONS.length - 1) setCurrentQ(currentQ + 1);
    else runAssessment();
  };

  return (
    <div style={{ maxWidth: 450, margin: "auto", padding: 25, color: "#e2e8f0", fontFamily: 'sans-serif' }}>
      <style>{`
        body { background: #050810; margin: 0; }
        .btn { background: linear-gradient(135deg, #4f46e5, #312e81); color: #fff; padding: 14px; width: 100%; border: 1px solid #6366f1; cursor: pointer; border-radius: 4px; font-weight: bold; }
        .inp { background: #0d1117; border: 1px solid #1e293b; color: #fff; padding: 12px; width: 100%; font-size: 16px; margin-bottom: 20px; border-radius: 4px; }
      `}</style>
      
      {screen === "intro" && (
        <div style={{ textAlign: "center", marginTop: "20vh" }}>
          <h1 style={{ letterSpacing: "2px" }}>SOLO LEVELING</h1>
          <p style={{ color: "#64748b", marginBottom: 30 }}>AVCI DEĞERLENDİRME SİSTEMİ</p>
          <button className="btn" onClick={() => setScreen("assessment")}>SİSTEMİ UYANDIR</button>
        </div>
      )}

      {screen === "assessment" && !loading && (
        <div>
          <div style={{ fontSize: "12px", color: "#4f46e5", marginBottom: 10 }}>SORU {currentQ + 1} / {QUESTIONS.length}</div>
          <h2 style={{ marginBottom: 20 }}>{QUESTIONS[currentQ].question}</h2>
          <input type="number" className="inp" autoFocus onChange={e => setAnswers({...answers, [QUESTIONS[currentQ].id]: e.target.value})} onKeyDown={e => e.key === "Enter" && advanceQ()} />
          <button className="btn" onClick={advanceQ}>ANALİZE DEVAM ET</button>
        </div>
      )}

      {loading && <div style={{ textAlign: "center", marginTop: "30vh", animation: "pulse 2s infinite" }}>
        <h3>SİSTEM VERİLERİ İŞLİYOR...</h3>
        <p style={{ fontSize: "12px", color: "#64748b" }}>Yapay zeka rütbeni belirliyor.</p>
      </div>}
      
      {errorMsg && (
        <div style={{ color: "#f87171", marginTop: 20, padding: 15, border: "1px solid #7f1d1d", background: "#1a1010", borderRadius: "4px" }}>
          <strong>SİSTEM HATASI:</strong> <div style={{ fontSize: "13px", marginTop: 5 }}>{errorMsg}</div>
        </div>
      )}

      {screen === "profile" && profile && (
        <div style={{ textAlign: "center", border: `2px solid ${RANK_COLORS[profile.rank]}`, padding: 30, borderRadius: "8px", boxShadow: `0 0 20px ${RANK_COLORS[profile.rank]}44` }}>
          <div style={{ fontSize: "14px", color: RANK_COLORS[profile.rank] }}>{profile.rank} SINIFI AVCI</div>
          <h1 style={{ margin: "10px 0" }}>{profile.title}</h1>
          <p style={{ lineHeight: "1.6", color: "#94a3b8" }}>{profile.analysis}</p>
          <button className="btn" style={{ marginTop: 30 }} onClick={() => window.location.reload()}>YENİDEN ANALİZ</button>
        </div>
      )}
    </div>
  );
}