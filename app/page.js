"use client";

import { useState, useRef, useCallback, useEffect } from "react";

/* ══════════════════════════════════════════════
   UTILITIES
   ══════════════════════════════════════════════ */
const TODAY = () => new Date().toISOString().slice(0, 10);
const WEEKDAYS = ["日","一","二","三","四","五","六"];

function loadData(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : fallback; } catch { return fallback; }
}
function saveData(key, val) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(val));
}

/* ══════════════════════════════════════════════
   COMPONENTS
   ══════════════════════════════════════════════ */

/* ── Calorie Ring ── */
function CalorieRing({ consumed, goal, size = 180 }) {
  const remaining = Math.max(goal - consumed, 0);
  const pct = Math.min(consumed / goal, 1);
  const r = (size - 20) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  const over = consumed > goal;

  return (
    <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f0ebe4" strokeWidth="12" />
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={over ? "#e8614d" : "#f5a623"} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease", filter: "drop-shadow(0 2px 8px rgba(245,166,35,0.3))" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 11, color: "#999", fontWeight: 500, letterSpacing: 0.5 }}>
          {over ? "已超标" : "剩余可摄入"}
        </span>
        <span style={{ fontSize: 42, fontWeight: 800, color: "#1a1a1a", lineHeight: 1,
          fontFamily: "'Outfit', sans-serif" }}>{remaining}</span>
        <span style={{ fontSize: 12, color: "#bbb", fontWeight: 500 }}>/ {goal} kcal</span>
      </div>
    </div>
  );
}

/* ── Macro Color Card ── */
function MacroCard({ label, value, unit, color, bgColor }) {
  return (
    <div style={{
      flex: 1, borderRadius: 16, padding: "16px 14px", background: bgColor,
      display: "flex", flexDirection: "column", gap: 4, minWidth: 0,
    }}>
      <span style={{ fontSize: 11, color: "rgba(0,0,0,0.45)", fontWeight: 600, textTransform: "uppercase",
        letterSpacing: 0.5 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: color, fontFamily: "'Outfit', sans-serif",
          lineHeight: 1 }}>{value}</span>
        <span style={{ fontSize: 12, color: "rgba(0,0,0,0.35)", fontWeight: 500 }}>{unit}</span>
      </div>
    </div>
  );
}

/* ── Nutrient Mini Bar ── */
function NutrientMini({ name, value, unit, percent, color }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>{name}</span>
        <span style={{ fontSize: 13, color: "#999" }}>{value}{unit}</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: "#f0ebe4", overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 3, background: color,
          width: `${Math.min(percent, 100)}%`, transition: "width 0.8s ease" }} />
      </div>
    </div>
  );
}

/* ── Bottom Nav ── */
function BottomNav({ tab, setTab }) {
  const items = [
    { id: "home", icon: "🏠", label: "首页" },
    { id: "scan", icon: "📷", label: "扫描" },
    { id: "analysis", icon: "📊", label: "分析" },
    { id: "settings", icon: "⚙️", label: "设置" },
  ];
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
      background: "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)",
      borderTop: "1px solid rgba(0,0,0,0.06)",
      display: "flex", justifyContent: "space-around",
      padding: "6px 0 env(safe-area-inset-bottom, 8px)",
    }}>
      {items.map(it => {
        const active = tab === it.id;
        return (
          <button key={it.id} onClick={() => setTab(it.id)} style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "6px 20px", display: "flex", flexDirection: "column",
            alignItems: "center", gap: 2, transition: "transform 0.15s",
            transform: active ? "scale(1.05)" : "scale(1)",
          }}>
            <span style={{ fontSize: 22, filter: active ? "none" : "grayscale(0.8) opacity(0.5)" }}>{it.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 600,
              color: active ? "#f5a623" : "#999",
              fontFamily: "'Outfit', sans-serif" }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Week Day Selector ── */
function WeekStrip({ selectedDate, onSelect }) {
  const days = [];
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    days.push(d);
  }

  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "0 4px", marginBottom: 20 }}>
      {days.map((d, i) => {
        const ds = d.toISOString().slice(0, 10);
        const isSelected = ds === selectedDate;
        const isToday = ds === TODAY();
        return (
          <button key={i} onClick={() => onSelect(ds)} style={{
            width: 40, height: 56, borderRadius: 14, border: "none", cursor: "pointer",
            background: isSelected ? "#f5a623" : "transparent",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
            transition: "all 0.2s",
          }}>
            <span style={{ fontSize: 11, fontWeight: 500,
              color: isSelected ? "#fff" : "#bbb" }}>{WEEKDAYS[d.getDay()]}</span>
            <span style={{ fontSize: 16, fontWeight: 700,
              color: isSelected ? "#fff" : isToday ? "#f5a623" : "#333",
              fontFamily: "'Outfit', sans-serif" }}>{d.getDate()}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN APP
   ══════════════════════════════════════════════ */
export default function Home() {
  const [tab, setTab] = useState("home");

  // scan
  const [image, setImage] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingMsg, setLoadingMsg] = useState("");
  const fileRef = useRef();

  // diary & goal
  const [diary, setDiary] = useState([]);
  const [goal, setGoal] = useState(2000);
  const [goalInput, setGoalInput] = useState("2000");
  const [selectedDate, setSelectedDate] = useState(TODAY());

  // suggest
  const [suggestions, setSuggestions] = useState(null);
  const [sugLoading, setSugLoading] = useState(false);

  useEffect(() => {
    setDiary(loadData("nl_diary", []));
    const g = loadData("nl_goal", 2000);
    setGoal(g); setGoalInput(String(g));
  }, []);
  useEffect(() => { if (diary.length > 0) saveData("nl_diary", diary); }, [diary]);

  const loadingMessages = ["识别食物中...", "分析营养成分...", "计算卡路里...", "生成报告..."];

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) { setError("请上传图片文件"); return; }
    if (file.size > 10 * 1024 * 1024) { setError("图片不能超过 10 MB"); return; }
    setError(null); setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target.result);
      setImageData({ data: e.target.result.split(",")[1], media_type: file.type });
    };
    reader.readAsDataURL(file);
  }, []);

  const analyze = async () => {
    if (!imageData) return;
    setLoading(true); setError(null);
    let msgIdx = 0; setLoadingMsg(loadingMessages[0]);
    const interval = setInterval(() => { msgIdx = (msgIdx+1)%loadingMessages.length; setLoadingMsg(loadingMessages[msgIdx]); }, 2000);
    try {
      const res = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_data: imageData.data, media_type: imageData.media_type }) });
      if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.error || "分析失败"); }
      setResult(await res.json());
    } catch (e) { setError(e.message || "分析失败"); }
    finally { clearInterval(interval); setLoading(false); }
  };

  const addToDiary = () => {
    if (!result) return;
    const entry = { id: Date.now(), date: TODAY(),
      time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      name: result.name, name_en: result.name_en, calories: result.calories,
      macros: result.macros, health_score: result.health_score, image };
    const nd = [entry, ...diary]; setDiary(nd); saveData("nl_diary", nd);
    setTab("home"); setImage(null); setImageData(null); setResult(null);
  };

  const deleteEntry = (id) => { const nd = diary.filter(e => e.id !== id); setDiary(nd); saveData("nl_diary", nd); };

  const saveGoal = () => { const v = parseInt(goalInput); if (v > 0 && v < 10000) { setGoal(v); saveData("nl_goal", v); } };

  const getSuggestions = async () => {
    setSugLoading(true); setSuggestions(null);
    const remaining = Math.max(goal - todayCal, 0);
    try {
      const res = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suggest_mode: true, remaining_calories: remaining,
          eaten_today: todayEntries.map(e => e.name).join("、") || "暂无", goal }) });
      if (!res.ok) throw new Error("获取推荐失败");
      setSuggestions(await res.json());
    } catch (e) { setError(e.message); }
    finally { setSugLoading(false); }
  };

  const reset = () => { setImage(null); setImageData(null); setResult(null); setError(null); };

  // aggregation
  const todayEntries = diary.filter(e => e.date === selectedDate);
  const todayCal = todayEntries.reduce((s, e) => s + e.calories, 0);
  const todayP = todayEntries.reduce((s, e) => s + (e.macros?.protein || 0), 0);
  const todayC = todayEntries.reduce((s, e) => s + (e.macros?.carbs || 0), 0);
  const todayF = todayEntries.reduce((s, e) => s + (e.macros?.fat || 0), 0);

  const monthName = new Date(selectedDate).toLocaleDateString("zh-CN", { month: "long", year: "numeric" });

  return (
    <div style={{
      minHeight: "100vh", paddingBottom: 80,
      background: "linear-gradient(180deg, #faf8f5 0%, #f5f0ea 100%)",
      fontFamily: "'Outfit', 'DM Sans', -apple-system, sans-serif", color: "#1a1a1a",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: 430, margin: "0 auto", padding: "0 16px" }}>

        {/* ════════════ HOME ════════════ */}
        {tab === "home" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "20px 0 16px" }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: "#1a1a1a" }}>
                  NutriLens
                </h1>
                <p style={{ fontSize: 13, color: "#999", margin: "2px 0 0", fontWeight: 500 }}>
                  {monthName}
                </p>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "#f5a623",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                🍽️
              </div>
            </div>

            {/* Week Strip */}
            <WeekStrip selectedDate={selectedDate} onSelect={setSelectedDate} />

            {/* Calorie Card */}
            <div style={{
              borderRadius: 24, padding: "28px 20px",
              background: "linear-gradient(145deg, #fffbf0, #fff8e8)",
              boxShadow: "0 4px 24px rgba(245,166,35,0.1)",
              marginBottom: 14,
            }}>
              <div style={{ textAlign: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#cba24a", textTransform: "uppercase",
                  letterSpacing: 1.5 }}>Calories left</span>
              </div>
              <CalorieRing consumed={todayCal} goal={goal} />
            </div>

            {/* Macro Cards */}
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <MacroCard label="蛋白质" value={todayP} unit="g" color="#5b7a3a" bgColor="#e8efc0" />
              <MacroCard label="碳水" value={todayC} unit="g" color="#9b6fbf" bgColor="#ede0f5" />
              <MacroCard label="脂肪" value={todayF} unit="g" color="#d4813b" bgColor="#fce8d0" />
            </div>

            {/* Today's Meals */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                marginBottom: 10, padding: "0 2px" }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a" }}>今日饮食</span>
                <button onClick={() => setTab("scan")} style={{
                  background: "#f5a623", border: "none", borderRadius: 10, padding: "6px 14px",
                  color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer",
                  boxShadow: "0 2px 10px rgba(245,166,35,0.3)",
                }}>+ 添加</button>
              </div>

              {todayEntries.length === 0 ? (
                <div style={{ borderRadius: 20, padding: "32px 20px", background: "#fff",
                  textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>🍽️</div>
                  <p style={{ fontSize: 14, color: "#999", margin: 0 }}>还没有记录</p>
                  <p style={{ fontSize: 12, color: "#ccc", margin: "4px 0 0" }}>去扫描页拍一张食物照片吧</p>
                </div>
              ) : (
                todayEntries.map(entry => (
                  <div key={entry.id} style={{
                    borderRadius: 16, padding: 0, background: "#fff", marginBottom: 8,
                    boxShadow: "0 2px 12px rgba(0,0,0,0.04)", overflow: "hidden",
                    display: "flex", alignItems: "center",
                  }}>
                    {entry.image && (
                      <img src={entry.image} alt="" style={{
                        width: 68, height: 68, objectFit: "cover", borderRadius: 12, margin: 8, flexShrink: 0
                      }} />
                    )}
                    <div style={{ flex: 1, padding: "10px 12px 10px 4px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>{entry.name}</span>
                        <span style={{ fontSize: 11, color: "#ccc" }}>{entry.time}</span>
                      </div>
                      <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                        <span style={{ fontSize: 14, color: "#f5a623", fontWeight: 700 }}>{entry.calories} kcal</span>
                        <span style={{ fontSize: 11, color: "#bbb", alignSelf: "center" }}>
                          P {entry.macros?.protein}g · C {entry.macros?.carbs}g · F {entry.macros?.fat}g
                        </span>
                      </div>
                    </div>
                    <button onClick={() => deleteEntry(entry.id)} style={{
                      background: "none", border: "none", color: "#ddd", fontSize: 18,
                      cursor: "pointer", padding: "0 14px", alignSelf: "stretch" }}>×</button>
                  </div>
                ))
              )}
            </div>

            {/* AI Suggest */}
            <div style={{ borderRadius: 20, padding: "20px", background: "#fff",
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)", marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 16, fontWeight: 700 }}>💡 智能推荐</span>
                <button onClick={getSuggestions} disabled={sugLoading} style={{
                  background: sugLoading ? "#eee" : "linear-gradient(135deg, #f5a623, #e89820)",
                  border: "none", borderRadius: 10, padding: "6px 14px",
                  color: "#fff", fontSize: 12, fontWeight: 600, cursor: sugLoading ? "wait" : "pointer",
                }}>{sugLoading ? "思考中..." : "获取推荐"}</button>
              </div>
              <p style={{ fontSize: 13, color: "#999", margin: 0, lineHeight: 1.5 }}>
                已摄入 <b style={{ color: "#f5a623" }}>{todayCal}</b> kcal，
                还剩 <b style={{ color: "#5b7a3a" }}>{Math.max(goal - todayCal, 0)}</b> kcal，
                AI 为你推荐合适的搭配
              </p>
              {suggestions?.meals?.map((meal, i) => (
                <div key={i} style={{ marginTop: 12, padding: "14px", borderRadius: 14,
                  background: ["#fffbf0","#f0f5e6","#f5eff8"][i % 3] }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{meal.emoji} {meal.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#f5a623" }}>{meal.calories} kcal</span>
                  </div>
                  <p style={{ fontSize: 12, color: "#888", margin: "4px 0 6px", lineHeight: 1.4 }}>{meal.description}</p>
                  <div style={{ display: "flex", gap: 10, fontSize: 11 }}>
                    <span style={{ color: "#5b7a3a", fontWeight: 600 }}>蛋白 {meal.protein}g</span>
                    <span style={{ color: "#9b6fbf", fontWeight: 600 }}>碳水 {meal.carbs}g</span>
                    <span style={{ color: "#d4813b", fontWeight: 600 }}>脂肪 {meal.fat}g</span>
                  </div>
                </div>
              ))}
              {suggestions?.tip && (
                <p style={{ fontSize: 12, color: "#999", marginTop: 12, padding: "10px 14px",
                  background: "#fffbf0", borderRadius: 10, lineHeight: 1.5 }}>💡 {suggestions.tip}</p>
              )}
            </div>
          </div>
        )}

        {/* ════════════ SCAN ════════════ */}
        {tab === "scan" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ padding: "20px 0 12px" }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Scanner</h2>
              <p style={{ fontSize: 13, color: "#999", margin: "2px 0 0" }}>拍照识别食物营养</p>
            </div>

            {/* Camera / Upload Area */}
            {!image && (
              <div onClick={() => fileRef.current?.click()} style={{
                borderRadius: 28, overflow: "hidden", position: "relative", cursor: "pointer",
                background: "#2a2a2a", height: 360, display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
              }}>
                <input ref={fileRef} type="file" accept="image/*" capture="environment"
                  style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
                {/* Scanner frame corners */}
                <div style={{ position: "absolute", inset: 40, border: "2px solid rgba(255,255,255,0.15)", borderRadius: 20 }} />
                <div style={{ position: "absolute", top: 38, left: 38, width: 28, height: 28,
                  borderTop: "3px solid #f5a623", borderLeft: "3px solid #f5a623", borderRadius: "8px 0 0 0" }} />
                <div style={{ position: "absolute", top: 38, right: 38, width: 28, height: 28,
                  borderTop: "3px solid #f5a623", borderRight: "3px solid #f5a623", borderRadius: "0 8px 0 0" }} />
                <div style={{ position: "absolute", bottom: 38, left: 38, width: 28, height: 28,
                  borderBottom: "3px solid #f5a623", borderLeft: "3px solid #f5a623", borderRadius: "0 0 0 8px" }} />
                <div style={{ position: "absolute", bottom: 38, right: 38, width: 28, height: 28,
                  borderBottom: "3px solid #f5a623", borderRight: "3px solid #f5a623", borderRadius: "0 0 8px 0" }} />
                <div style={{ textAlign: "center", zIndex: 1 }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
                  <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 15, fontWeight: 600, margin: 0 }}>
                    点击拍照或上传
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: "6px 0 0" }}>
                    支持 JPG、PNG 格式
                  </p>
                </div>
              </div>
            )}

            {/* Action buttons under scanner */}
            {!image && (
              <div style={{ display: "flex", gap: 10, marginTop: 14, justifyContent: "center" }}>
                {[
                  { icon: "📸", label: "拍照", action: () => fileRef.current?.click() },
                  { icon: "🖼️", label: "相册", action: () => fileRef.current?.click() },
                  { icon: "📋", label: "历史", action: () => setTab("home") },
                ].map((btn, i) => (
                  <button key={i} onClick={btn.action} style={{
                    flex: 1, padding: "14px 0", borderRadius: 16, border: "none",
                    background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                    cursor: "pointer", display: "flex", flexDirection: "column",
                    alignItems: "center", gap: 4,
                  }}>
                    <span style={{ fontSize: 22 }}>{btn.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#666" }}>{btn.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Image preview */}
            {image && !result && (
              <div style={{ animation: "fadeIn 0.3s ease" }}>
                <div style={{ borderRadius: 24, overflow: "hidden", position: "relative",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
                  <img src={image} alt="food" style={{ width: "100%", height: 300, objectFit: "cover", display: "block" }} />
                  {loading && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)",
                      backdropFilter: "blur(8px)", display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center", gap: 14 }}>
                      <div style={{ width: 40, height: 40, border: "3px solid rgba(255,255,255,0.2)",
                        borderTopColor: "#f5a623", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                      <span style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>{loadingMsg}</span>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                  <button onClick={reset} style={{ flex: 1, padding: "14px", borderRadius: 14, border: "none",
                    background: "#fff", color: "#666", fontSize: 14, fontWeight: 600, cursor: "pointer",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>重新拍</button>
                  <button onClick={analyze} disabled={loading} style={{ flex: 2, padding: "14px",
                    borderRadius: 14, border: "none", fontSize: 14, fontWeight: 600, cursor: loading ? "wait" : "pointer",
                    background: loading ? "#eee" : "linear-gradient(135deg, #f5a623, #e89820)",
                    color: "#fff", boxShadow: "0 4px 16px rgba(245,166,35,0.3)" }}>
                    {loading ? "分析中..." : "开始分析"}</button>
                </div>
              </div>
            )}

            {error && (
              <div style={{ marginTop: 12, padding: "12px 16px", borderRadius: 14,
                background: "#fef0ed", color: "#e8614d", fontSize: 13, textAlign: "center",
                fontWeight: 500 }}>{error}</div>
            )}

            {/* Results */}
            {result && (
              <div style={{ animation: "fadeIn 0.4s ease" }}>
                {/* Food hero */}
                <div style={{ borderRadius: 24, overflow: "hidden", background: "#fff",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.06)", marginBottom: 14 }}>
                  <img src={image} alt="food" style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }} />
                  <div style={{ padding: "16px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <span style={{ fontSize: 11, color: "#f5a623", fontWeight: 600, textTransform: "uppercase",
                          letterSpacing: 0.5 }}>{result.name_en}</span>
                        <h3 style={{ fontSize: 22, fontWeight: 800, margin: "2px 0 0", color: "#1a1a1a" }}>{result.name}</h3>
                      </div>
                      <div style={{ padding: "4px 10px", borderRadius: 8, background: "#fffbf0",
                        fontSize: 12, fontWeight: 700, color: "#f5a623" }}>{result.confidence}%</div>
                    </div>
                    <p style={{ fontSize: 13, color: "#999", margin: "6px 0 0" }}>{result.description}</p>

                    {/* Health score bar */}
                    <div style={{ marginTop: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#666" }}>Health score</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#f5a623" }}>{result.health_score * 10}%</span>
                      </div>
                      <div style={{ height: 8, borderRadius: 4, background: "#f0ebe4", overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 4, width: `${result.health_score * 10}%`,
                          background: "linear-gradient(90deg, #f5a623, #e89820)", transition: "width 0.8s ease" }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Calories + Macros */}
                <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                  <div style={{ flex: 1, borderRadius: 20, padding: "20px 16px", textAlign: "center",
                    background: "linear-gradient(145deg, #fffbf0, #fff5e0)",
                    boxShadow: "0 2px 12px rgba(245,166,35,0.08)" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#cba24a", textTransform: "uppercase",
                      letterSpacing: 1 }}>Calories</span>
                    <div style={{ fontSize: 36, fontWeight: 900, color: "#f5a623", marginTop: 4,
                      fontFamily: "'Outfit', sans-serif" }}>{result.calories}</div>
                    <span style={{ fontSize: 12, color: "#ccc" }}>kcal</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                  <MacroCard label="蛋白质" value={result.macros.protein} unit="g" color="#5b7a3a" bgColor="#e8efc0" />
                  <MacroCard label="碳水" value={result.macros.carbs} unit="g" color="#9b6fbf" bgColor="#ede0f5" />
                  <MacroCard label="脂肪" value={result.macros.fat} unit="g" color="#d4813b" bgColor="#fce8d0" />
                </div>

                {/* Details */}
                {result.details?.length > 0 && (
                  <div style={{ borderRadius: 20, padding: "18px 20px", background: "#fff",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.04)", marginBottom: 14 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>营养详情</span>
                    <div style={{ marginTop: 14 }}>
                      {result.details.map((d, i) => (
                        <NutrientMini key={i} name={d.name} value={d.value} unit={d.unit} percent={d.percent}
                          color={["#f5a623","#5b7a3a","#9b6fbf","#e8614d","#4da6c9","#d4813b"][i % 6]} />
                      ))}
                    </div>
                  </div>
                )}

                {result.tips && (
                  <div style={{ borderRadius: 16, padding: "14px 18px", marginBottom: 14,
                    background: "#fffbf0", border: "1px solid #f5e6c0" }}>
                    <span style={{ fontSize: 13, color: "#999", lineHeight: 1.6 }}>💡 {result.tips}</span>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={addToDiary} style={{ flex: 1, padding: "16px", borderRadius: 16, border: "none",
                    background: "linear-gradient(135deg, #f5a623, #e89820)", color: "#fff", fontSize: 15,
                    fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(245,166,35,0.3)" }}>
                    记入日记</button>
                  <button onClick={reset} style={{ padding: "16px 20px", borderRadius: 16, border: "none",
                    background: "#fff", color: "#999", fontSize: 15, fontWeight: 600, cursor: "pointer",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>再拍一张</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════ ANALYSIS ════════════ */}
        {tab === "analysis" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ padding: "20px 0 16px" }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>分析</h2>
              <p style={{ fontSize: 13, color: "#999", margin: "2px 0 0" }}>查看你的饮食数据</p>
            </div>

            {/* Weekly chart */}
            <div style={{ borderRadius: 20, padding: "20px", background: "#fff",
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)", marginBottom: 14 }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>最近 7 天</span>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end",
                height: 140, marginTop: 16, padding: "0 4px" }}>
                {Array.from({ length: 7 }).map((_, i) => {
                  const d = new Date(); d.setDate(d.getDate() - 6 + i);
                  const ds = d.toISOString().slice(0, 10);
                  const dayCal = diary.filter(e => e.date === ds).reduce((s, e) => s + e.calories, 0);
                  const pct = goal > 0 ? Math.min(dayCal / goal, 1.3) : 0;
                  const barH = Math.max(pct * 100, 4);
                  const isT = ds === TODAY();
                  const over = dayCal > goal;
                  return (
                    <div key={ds} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 6 }}>
                      <span style={{ fontSize: 10, color: "#bbb", fontWeight: 600 }}>{dayCal > 0 ? dayCal : ""}</span>
                      <div style={{ width: 24, height: barH, borderRadius: 8,
                        background: over ? "#e8614d" : isT ? "linear-gradient(180deg, #f5a623, #e89820)" : "#f0ebe4",
                        transition: "height 0.5s ease",
                        boxShadow: isT ? "0 2px 8px rgba(245,166,35,0.3)" : "none" }} />
                      <span style={{ fontSize: 11, fontWeight: isT ? 700 : 500,
                        color: isT ? "#f5a623" : "#bbb" }}>{WEEKDAYS[d.getDay()]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Avg stats */}
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              {[
                { label: "平均热量", val: Math.round(diary.filter(e => { const d = new Date(); d.setDate(d.getDate()-6);
                  return e.date >= d.toISOString().slice(0,10); }).reduce((s,e) => s + e.calories, 0) / 7), unit: "kcal", bg: "#fffbf0", color: "#f5a623" },
                { label: "记录天数", val: [...new Set(diary.map(e => e.date))].length, unit: "天", bg: "#e8efc0", color: "#5b7a3a" },
                { label: "总记录", val: diary.length, unit: "条", bg: "#ede0f5", color: "#9b6fbf" },
              ].map((s, i) => (
                <div key={i} style={{ flex: 1, borderRadius: 16, padding: "16px 12px", background: s.bg, textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "rgba(0,0,0,0.4)", fontWeight: 600, textTransform: "uppercase",
                    letterSpacing: 0.5 }}>{s.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: s.color, marginTop: 4,
                    fontFamily: "'Outfit', sans-serif" }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: "rgba(0,0,0,0.3)" }}>{s.unit}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════ SETTINGS ════════════ */}
        {tab === "settings" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ padding: "20px 0 16px" }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>设置</h2>
              <p style={{ fontSize: 13, color: "#999", margin: "2px 0 0" }}>调整你的目标和偏好</p>
            </div>

            {/* Goal setting */}
            <div style={{ borderRadius: 20, padding: "20px", background: "#fff",
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)", marginBottom: 14 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>每日卡路里目标</span>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 14 }}>
                <input type="number" value={goalInput} onChange={e => setGoalInput(e.target.value)}
                  style={{ flex: 1, padding: "14px 16px", borderRadius: 14,
                    border: "2px solid #f0ebe4", background: "#faf8f5", color: "#1a1a1a",
                    fontSize: 18, fontWeight: 700, fontFamily: "'Outfit', sans-serif", outline: "none",
                    transition: "border-color 0.2s" }}
                  onFocus={e => e.target.style.borderColor = "#f5a623"}
                  onBlur={e => e.target.style.borderColor = "#f0ebe4"} />
                <span style={{ fontSize: 14, color: "#999", fontWeight: 500 }}>kcal</span>
                <button onClick={saveGoal} style={{
                  padding: "14px 20px", borderRadius: 14, border: "none",
                  background: "linear-gradient(135deg, #f5a623, #e89820)",
                  color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
                  boxShadow: "0 2px 10px rgba(245,166,35,0.25)" }}>保存</button>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                {[
                  { label: "减脂", val: 1500, emoji: "🏃" },
                  { label: "维持", val: 2000, emoji: "⚖️" },
                  { label: "增肌", val: 2500, emoji: "💪" },
                ].map(p => (
                  <button key={p.val} onClick={() => { setGoalInput(String(p.val)); setGoal(p.val); saveData("nl_goal", p.val); }}
                    style={{ flex: 1, padding: "14px 8px", borderRadius: 14, cursor: "pointer",
                      border: goal === p.val ? "2px solid #f5a623" : "2px solid #f0ebe4",
                      background: goal === p.val ? "#fffbf0" : "#fff", textAlign: "center",
                      transition: "all 0.2s",
                    }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{p.emoji}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: goal === p.val ? "#f5a623" : "#333" }}>{p.label}</div>
                    <div style={{ fontSize: 11, color: "#bbb", marginTop: 2 }}>{p.val} kcal</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Info */}
            <div style={{ borderRadius: 20, padding: "20px", background: "#fff",
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>关于 NutriLens</span>
              <p style={{ fontSize: 13, color: "#999", margin: "8px 0 0", lineHeight: 1.6 }}>
                NutriLens 使用 AI 技术分析食物照片，帮助你追踪每日营养摄入。
                数据存储在你的设备本地，保护你的隐私。
              </p>
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <div style={{ flex: 1, padding: "12px", borderRadius: 12, background: "#faf8f5", textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#bbb", fontWeight: 500 }}>版本</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#333", marginTop: 2 }}>2.0</div>
                </div>
                <div style={{ flex: 1, padding: "12px", borderRadius: 12, background: "#faf8f5", textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#bbb", fontWeight: 500 }}>AI 引擎</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#333", marginTop: 2 }}>Claude</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomNav tab={tab} setTab={setTab} />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        *, *::before, *::after { box-sizing: border-box; }
        button:active { transform: scale(0.97); }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
      `}</style>
    </div>
  );
}
