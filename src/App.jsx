import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const FEELING_OPTIONS = ["很好 💪", "良好 😊", "普通 😐", "疲勞 😓", "很累 😫"];

const defaultSession = () => ({
  tempId: Date.now(),
  date: "",
  startTime: "20:30",
  bedTime: "",
  wakeTime: "",
  feeling: "",
  discomfortNotes: "",
  exercises: [{ name: "", sets: "", reps: "", weight: "" }],
});

function ExerciseRow({ ex, idx, onChange, onRemove }) {
  return (
    <div className="exercise-row">
      <input className="input ex-name" placeholder="動作名稱" value={ex.name}
        onChange={(e) => onChange(idx, "name", e.target.value)} />
      <input className="input ex-num" placeholder="重量(kg)" type="number" value={ex.weight}
        onChange={(e) => onChange(idx, "weight", e.target.value)} />
      <input className="input ex-num" placeholder="組數" type="number" value={ex.sets}
        onChange={(e) => onChange(idx, "sets", e.target.value)} />
      <input className="input ex-num" placeholder="次數" type="number" value={ex.reps}
        onChange={(e) => onChange(idx, "reps", e.target.value)} />
      <button className="btn-remove" onClick={() => onRemove(idx)}>✕</button>
    </div>
  );
}

function SessionCard({ session, onChange, onSave, onDelete, saving }) {
  const updateEx = (idx, field, val) => {
    const exs = session.exercises.map((e, i) => i === idx ? { ...e, [field]: val } : e);
    onChange({ ...session, exercises: exs });
  };
  const addEx = () => onChange({ ...session, exercises: [...session.exercises, { name: "", sets: "", reps: "", weight: "" }] });
  const removeEx = (idx) => onChange({ ...session, exercises: session.exercises.filter((_, i) => i !== idx) });

  return (
    <div className="session-card">
      <div className="session-header">
        <span className="session-label">訓練紀錄</span>
        <div className="session-actions">
          <button className="btn-save" onClick={onSave} disabled={saving}>
            {saving ? "儲存中…" : "☁️ 儲存"}
          </button>
          <button className="btn-delete" onClick={onDelete}>🗑</button>
        </div>
      </div>
      <div className="row-2">
        <div className="field">
          <label>日期</label>
          <input className="input" type="date" value={session.date}
            onChange={(e) => onChange({ ...session, date: e.target.value })} />
        </div>
        <div className="field">
          <label>開始時間</label>
          <input className="input" type="time" value={session.startTime}
            onChange={(e) => onChange({ ...session, startTime: e.target.value })} />
        </div>
        <div className="field">
          <label>就寢時間</label>
          <input className="input" type="time" value={session.bedTime}
            onChange={(e) => onChange({ ...session, bedTime: e.target.value })} />
        </div>
        <div className="field">
          <label>起床時間</label>
          <input className="input" type="time" value={session.wakeTime}
            onChange={(e) => onChange({ ...session, wakeTime: e.target.value })} />
        </div>
      </div>
      <div className="field">
        <label>訓練後感受</label>
        <div className="feeling-group">
          {FEELING_OPTIONS.map((f) => (
            <button key={f} className={`feeling-btn ${session.feeling === f ? "active" : ""}`}
              onClick={() => onChange({ ...session, feeling: f })}>{f}</button>
          ))}
        </div>
      </div>
      <div className="field discomfort-field">
        <label>🩹 不適 / 疼痛紀錄</label>
        <textarea className="input discomfort-textarea"
          placeholder="描述訓練部位的不適或疼痛情況，例如：左肩旋轉肌輕微痠痛、膝蓋深蹲時有摩擦感…"
          value={session.discomfortNotes || ""}
          onChange={(e) => onChange({ ...session, discomfortNotes: e.target.value })}
          rows={3} />
      </div>
      <div className="exercises-section">
        <div className="ex-header-row">
          <span className="ex-col-label">動作名稱</span>
          <span className="ex-col-label">重量(kg)</span>
          <span className="ex-col-label">組數</span>
          <span className="ex-col-label">次數</span>
          <span className="ex-col-label" />
        </div>
        {session.exercises.map((ex, i) => (
          <ExerciseRow key={i} ex={ex} idx={i} onChange={updateEx} onRemove={removeEx} />
        ))}
        <button className="btn-add-ex" onClick={addEx}>＋ 新增動作</button>
      </div>
    </div>
  );
}

function AIAdvice({ weekData }) {
  const [advice, setAdvice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getAdvice = async () => {
    setLoading(true); setError(""); setAdvice("");
    const summary = `
當週體重: ${weekData.weight} kg
訓練計畫：每週4~5次，每次約1.5小時，約20:30開始

訓練紀錄：
${weekData.sessions.map((s, i) => `
第${i + 1}次訓練（${s.date} ${s.start_time || s.startTime}開始）：
- 訓練後感受：${s.feeling || "未填寫"}
- 不適／疼痛紀錄：${s.discomfort_notes || s.discomfortNotes || "無"}
- 就寢時間：${s.bed_time || s.bedTime || "未填寫"}，起床時間：${s.wake_time || s.wakeTime || "未填寫"}
- 訓練動作：
${(s.exercises || []).map(e => `  • ${e.name}：${e.weight}kg × ${e.sets}組 × ${e.reps}下`).join("\n")}
`).join("")}`.trim();

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `你是一位專業的健身教練與運動科學專家，專長在肌力訓練計畫設計與運動恢復建議。
請根據使用者本週的訓練紀錄、感受、不適與疼痛紀錄以及睡眠資料，提供具體、實用、有針對性的下週訓練建議。
若有記錄不適或疼痛，請特別針對該部位給予注意事項或調整建議。
請用繁體中文回答，並以結構化方式呈現（包含：整體評估、身體狀況與傷害風險提醒、下週訓練建議、恢復與睡眠建議）。語氣要專業但親切。`,
          messages: [{ role: "user", content: `以下是我本週的訓練資料，請給我下週的訓練建議：\n\n${summary}` }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("\n") || "無法取得建議";
      setAdvice(text);
    } catch {
      setError("取得建議時發生錯誤，請稍後再試。");
    }
    setLoading(false);
  };

  return (
    <div className="advice-section">
      <div className="advice-header">
        <h2 className="section-title">🤖 AI 訓練建議</h2>
        <button className="btn-advice" onClick={getAdvice} disabled={loading}>
          {loading ? "分析中…" : "取得下週建議"}
        </button>
      </div>
      {error && <p className="error-msg">{error}</p>}
      {advice && (
        <div className="advice-content">
          {advice.split("\n").map((line, i) => {
            if (line.startsWith("##")) return <h3 key={i} className="advice-h3">{line.replace(/^##\s*/, "")}</h3>;
            if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="advice-bold">{line.replace(/\*\*/g, "")}</p>;
            if (line.startsWith("- ") || line.startsWith("• ")) return <li key={i} className="advice-li">{line.slice(2)}</li>;
            if (line.trim() === "") return <br key={i} />;
            return <p key={i} className="advice-p">{line}</p>;
          })}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [weeks, setWeeks] = useState([]);
  const [activeWeek, setActiveWeek] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [localSessions, setLocalSessions] = useState([]);
  const [savingIdx, setSavingIdx] = useState(null);
  const [activeTab, setActiveTab] = useState("log");
  const [loading, setLoading] = useState(true);
  const [weekSaving, setWeekSaving] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase.from("weeks").select("*").order("created_at");
      if (data && data.length > 0) {
        setWeeks(data);
        setActiveWeek(data[0].id);
      } else {
        const { data: w } = await supabase.from("weeks").insert({ label: "第 1 週", weight: "" }).select().single();
        if (w) { setWeeks([w]); setActiveWeek(w.id); }
      }
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!activeWeek) return;
    const load = async () => {
      const { data } = await supabase.from("sessions").select("*").eq("week_id", activeWeek).order("created_at");
      setSessions(data || []);
      setLocalSessions(data ? data.map(s => ({ ...s })) : []);
    };
    load();
  }, [activeWeek]);

  const currentWeek = weeks.find(w => w.id === activeWeek);

  const addWeek = async () => {
    const label = `第 ${weeks.length + 1} 週`;
    const { data } = await supabase.from("weeks").insert({ label, weight: "" }).select().single();
    if (data) { setWeeks(ws => [...ws, data]); setActiveWeek(data.id); setActiveTab("log"); }
  };

  const updateWeekWeight = (weight) => {
    setWeeks(ws => ws.map(w => w.id === activeWeek ? { ...w, weight } : w));
  };

  const saveWeekWeight = async () => {
    setWeekSaving(true);
    await supabase.from("weeks").update({ weight: currentWeek.weight }).eq("id", activeWeek);
    setWeekSaving(false);
    showToast("體重已儲存 ✅");
  };

  const addSession = () => {
    setLocalSessions(ls => [...ls, defaultSession()]);
  };

  const updateLocalSession = (idx, updated) => {
    setLocalSessions(ls => ls.map((s, i) => i === idx ? updated : s));
  };

  const saveSession = async (idx) => {
    setSavingIdx(idx);
    const s = localSessions[idx];
    const payload = {
      week_id: activeWeek,
      date: s.date,
      start_time: s.startTime || s.start_time,
      bed_time: s.bedTime || s.bed_time,
      wake_time: s.wakeTime || s.wake_time,
      feeling: s.feeling,
      discomfort_notes: s.discomfortNotes || s.discomfort_notes,
      exercises: s.exercises,
    };
    if (s.id && !s.tempId) {
      await supabase.from("sessions").update(payload).eq("id", s.id);
      showToast("訓練已更新 ✅");
    } else {
      const { data } = await supabase.from("sessions").insert(payload).select().single();
      if (data) {
        setLocalSessions(ls => ls.map((ls2, i) => i === idx ? { ...data } : ls2));
        showToast("訓練已儲存 ✅");
      }
    }
    setSavingIdx(null);
  };

  const deleteSession = async (idx) => {
    const s = localSessions[idx];
    if (s.id && !s.tempId) {
      await supabase.from("sessions").delete().eq("id", s.id);
    }
    setLocalSessions(ls => ls.filter((_, i) => i !== idx));
    showToast("已刪除 🗑");
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-title">TRAINWEEK</div>
      <div className="loading-sub">連線中…</div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Noto+Sans+TC:wght@400;500;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0d0d0f; color: #e8e4dc; font-family: 'Noto Sans TC', sans-serif; min-height: 100vh; }

        .loading-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; }
        .loading-title { font-family: 'Bebas Neue', sans-serif; font-size: 52px; letter-spacing: 6px; color: #f0e6d0; }
        .loading-sub { color: #555; font-size: 13px; margin-top: 12px; letter-spacing: 2px; }

        .app { max-width: 860px; margin: 0 auto; padding: 24px 16px 80px; }
        .hero { text-align: center; padding: 40px 0 32px; }
        .hero-title { font-family: 'Bebas Neue', sans-serif; font-size: clamp(42px, 8vw, 72px); letter-spacing: 4px; color: #f0e6d0; line-height: 1; }
        .hero-title span { color: #e8a030; }
        .hero-sub { font-size: 13px; color: #888; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px; }

        .week-tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px; align-items: center; }
        .week-tab { background: transparent; border: 1px solid #333; color: #888; padding: 8px 18px; border-radius: 4px; cursor: pointer; font-family: 'Noto Sans TC', sans-serif; font-size: 13px; transition: all .2s; }
        .week-tab.active { background: #e8a030; border-color: #e8a030; color: #0d0d0f; font-weight: 700; }
        .week-tab:hover:not(.active) { border-color: #e8a030; color: #e8a030; }
        .btn-new-week { background: transparent; border: 1px dashed #555; color: #888; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 13px; font-family: 'Noto Sans TC', sans-serif; transition: all .2s; }
        .btn-new-week:hover { border-color: #e8a030; color: #e8a030; }

        .week-meta { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; background: #161618; border: 1px solid #2a2a2c; border-radius: 8px; padding: 16px 20px; }
        .week-meta label { font-size: 13px; color: #888; white-space: nowrap; }
        .week-meta input { background: #0d0d0f; border: 1px solid #333; color: #e8e4dc; padding: 8px 12px; border-radius: 4px; font-family: 'Noto Sans TC', sans-serif; font-size: 14px; width: 100px; }
        .week-meta input:focus { outline: none; border-color: #e8a030; }
        .btn-save-weight { background: transparent; border: 1px solid #e8a030; color: #e8a030; padding: 8px 14px; border-radius: 4px; cursor: pointer; font-size: 12px; font-family: 'Noto Sans TC', sans-serif; transition: all .2s; white-space: nowrap; }
        .btn-save-weight:hover { background: #1a1500; }
        .btn-save-weight:disabled { opacity: .5; cursor: not-allowed; }

        .tabs { display: flex; border-bottom: 1px solid #2a2a2c; margin-bottom: 24px; }
        .tab { background: transparent; border: none; color: #666; padding: 10px 20px; cursor: pointer; font-family: 'Noto Sans TC', sans-serif; font-size: 14px; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: all .2s; }
        .tab.active { color: #e8a030; border-bottom-color: #e8a030; }
        .tab:hover:not(.active) { color: #aaa; }

        .session-card { background: #161618; border: 1px solid #2a2a2c; border-radius: 8px; padding: 20px; margin-bottom: 16px; }
        .session-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .session-label { font-family: 'Bebas Neue', sans-serif; font-size: 18px; letter-spacing: 2px; color: #e8a030; }
        .session-actions { display: flex; gap: 8px; align-items: center; }
        .btn-save { background: transparent; border: 1px solid #4a7a20; color: #7ab030; padding: 5px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-family: 'Noto Sans TC', sans-serif; transition: all .2s; }
        .btn-save:hover:not(:disabled) { background: #1a2a10; }
        .btn-save:disabled { opacity: .5; cursor: not-allowed; }
        .btn-delete { background: transparent; border: 1px solid #3a2020; color: #a05050; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 14px; transition: all .2s; }
        .btn-delete:hover { background: #3a2020; color: #e07070; }

        .row-2 { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; margin-bottom: 16px; }
        .field { display: flex; flex-direction: column; gap: 5px; }
        .field label { font-size: 11px; color: #888; letter-spacing: 1px; text-transform: uppercase; }
        .input { background: #0d0d0f; border: 1px solid #2a2a2c; color: #e8e4dc; padding: 8px 10px; border-radius: 4px; font-family: 'Noto Sans TC', sans-serif; font-size: 13px; transition: border-color .2s; }
        .input:focus { outline: none; border-color: #e8a030; }

        .feeling-group { display: flex; gap: 8px; flex-wrap: wrap; }
        .feeling-btn { background: transparent; border: 1px solid #2a2a2c; color: #888; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-family: 'Noto Sans TC', sans-serif; font-size: 12px; transition: all .2s; }
        .feeling-btn.active { background: #1e2a10; border-color: #7ab030; color: #a0d060; }
        .feeling-btn:hover:not(.active) { border-color: #555; color: #ccc; }

        .discomfort-field { margin-top: 12px; }
        .discomfort-textarea { width: 100%; resize: vertical; min-height: 72px; line-height: 1.6; }
        .discomfort-textarea::placeholder { color: #444; }
        .discomfort-textarea:focus { border-color: #c05050 !important; box-shadow: 0 0 0 2px rgba(192,80,80,0.08); }

        .exercises-section { margin-top: 16px; }
        .ex-header-row { display: grid; grid-template-columns: 1fr 90px 70px 70px 36px; gap: 8px; margin-bottom: 6px; padding: 0 4px; }
        .ex-col-label { font-size: 10px; color: #555; letter-spacing: 1px; text-transform: uppercase; }
        .exercise-row { display: grid; grid-template-columns: 1fr 90px 70px 70px 36px; gap: 8px; margin-bottom: 6px; }
        .ex-num { text-align: center; }
        .btn-remove { background: transparent; border: 1px solid #2a2a2c; color: #555; border-radius: 4px; cursor: pointer; font-size: 14px; transition: all .2s; }
        .btn-remove:hover { border-color: #7a2a2a; color: #e07070; }
        .btn-add-ex { background: transparent; border: 1px dashed #333; color: #666; padding: 8px; border-radius: 4px; cursor: pointer; font-family: 'Noto Sans TC', sans-serif; font-size: 12px; width: 100%; margin-top: 6px; transition: all .2s; }
        .btn-add-ex:hover { border-color: #e8a030; color: #e8a030; }

        .btn-add-session { background: transparent; border: 1px dashed #e8a030; color: #e8a030; padding: 12px; border-radius: 8px; cursor: pointer; font-family: 'Noto Sans TC', sans-serif; font-size: 14px; width: 100%; margin-top: 8px; transition: all .2s; letter-spacing: 2px; }
        .btn-add-session:hover { background: #1a1500; }

        .advice-section { background: #161618; border: 1px solid #2a2a2c; border-radius: 8px; padding: 24px; }
        .advice-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .section-title { font-family: 'Bebas Neue', sans-serif; font-size: 24px; letter-spacing: 3px; color: #f0e6d0; }
        .btn-advice { background: #e8a030; border: none; color: #0d0d0f; padding: 10px 22px; border-radius: 4px; cursor: pointer; font-family: 'Noto Sans TC', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 1px; transition: all .2s; }
        .btn-advice:hover:not(:disabled) { background: #f0b840; }
        .btn-advice:disabled { opacity: .5; cursor: not-allowed; }
        .advice-content { border-top: 1px solid #2a2a2c; padding-top: 20px; line-height: 1.8; }
        .advice-h3 { font-size: 15px; font-weight: 700; color: #e8a030; margin: 16px 0 8px; }
        .advice-p { font-size: 14px; color: #c8c4bc; margin-bottom: 4px; }
        .advice-bold { font-size: 14px; color: #e8e4dc; font-weight: 700; margin: 8px 0 4px; }
        .advice-li { font-size: 14px; color: #c8c4bc; margin: 4px 0 4px 20px; list-style: disc; }
        .error-msg { color: #e07070; font-size: 13px; margin-top: 12px; }

        .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #1e2a10; border: 1px solid #7ab030; color: #a0d060; padding: 10px 24px; border-radius: 24px; font-size: 13px; font-family: 'Noto Sans TC', sans-serif; z-index: 999; pointer-events: none; animation: fadeIn .2s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

        @media (max-width: 560px) {
          .exercise-row, .ex-header-row { grid-template-columns: 1fr 70px 55px 55px 32px; }
          .row-2 { grid-template-columns: 1fr 1fr; }
          .feeling-btn { font-size: 11px; padding: 5px 8px; }
        }
      `}</style>
      <div className="app">
        <div className="hero">
          <div className="hero-title">TRAIN<span>WEEK</span></div>
          <div className="hero-sub">Weekly Workout Tracker · AI Coaching</div>
        </div>

        <div className="week-tabs">
          {weeks.map((w) => (
            <button key={w.id} className={`week-tab ${w.id === activeWeek ? "active" : ""}`}
              onClick={() => { setActiveWeek(w.id); setActiveTab("log"); }}>
              {w.label}
            </button>
          ))}
          <button className="btn-new-week" onClick={addWeek}>＋ 新增週次</button>
        </div>

        {currentWeek && (
          <div className="week-meta">
            <label>📦 當週體重</label>
            <input type="number" placeholder="kg"
              value={currentWeek.weight}
              onChange={(e) => updateWeekWeight(e.target.value)} />
            <span style={{ fontSize: 12, color: "#555" }}>kg</span>
            <button className="btn-save-weight" onClick={saveWeekWeight} disabled={weekSaving}>
              {weekSaving ? "儲存中…" : "☁️ 儲存體重"}
            </button>
          </div>
        )}

        <div className="tabs">
          <button className={`tab ${activeTab === "log" ? "active" : ""}`} onClick={() => setActiveTab("log")}>📋 訓練紀錄</button>
          <button className={`tab ${activeTab === "advice" ? "active" : ""}`} onClick={() => setActiveTab("advice")}>🤖 AI 建議</button>
        </div>

        {activeTab === "log" && (
          <>
            {localSessions.map((s, i) => (
              <SessionCard key={s.id || s.tempId} session={s}
                onChange={(updated) => updateLocalSession(i, updated)}
                onSave={() => saveSession(i)}
                onDelete={() => deleteSession(i)}
                saving={savingIdx === i} />
            ))}
            <button className="btn-add-session" onClick={addSession}>＋ 新增訓練</button>
          </>
        )}

        {activeTab === "advice" && currentWeek && (
          <AIAdvice weekData={{ ...currentWeek, sessions: localSessions }} />
        )}
      </div>
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
