"use client";

import { useState, useRef, useCallback, useEffect } from "react";

/* ══════════════════════════════════════════════
   UTILITIES
   ══════════════════════════════════════════════ */
const TODAY = () => new Date().toISOString().slice(0, 10);

function loadData(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const d = localStorage.getItem(key);
    return d ? JSON.parse(d) : fallback;
  } catch {
    return fallback;
  }
}
function saveData(key, val) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(val));
}

/* ══════════════════════════════════════════════
   COMPONENTS
   ══════════════════════════════════════════════ */

/* ── 环形进度条 ── */
function CircularProgress({ value, max, label, color, unit = "g", size = 90 }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const offset = circ * (1 - pct);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div style={{ marginTop: -size/2 - 12, textAlign: "center", height: size/2 + 12,
        display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <span style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Playfair Display', serif", color: "#e8e6e3" }}>{value}</span>
        <span style={{ fontSize: 10, color: "#6b6560", letterSpacing: 0.5 }}>{unit}</span>
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: "#9a9590", textTransform: "uppercase",
        letterSpacing: 1.2, fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
    </div>
  );
}

/* ── 营养素条 ── */
function NutrientBar({ name, value, unit, percent, color, emoji }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0" }}>
      <span style={{ fontSize: 18, width: 26, textAlign: "center" }}>{emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#e8e6e3" }}>{name}</span>
          <span style={{ fontSize: 13, color: "#9a9590", fontFamily: "'Playfair Display', serif" }}>{value}{unit}</span>
        </div>
        <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 3, background: color,
            width: `${Math.min(percent, 100)}%`, transition: "width 1s ease" }} />
        </div>
      </div>
    </div>
  );
}

/* ── 每日卡路里进度环 ── */
function DailyRing({ consumed, goal }) {
  const pct = Math.min(consumed / goal, 1);
  const remaining = Math.max(goal - consumed, 0);
  const r = 70;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  const ringColor = pct > 1 ? "#E76F51" : pct > 0.8 ? "#F4A261" : "#2A9D8F";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={168} height={168} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={84} cy={84} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle cx={84} cy={84} r={r} fill="none" stroke={ringColor} strokeWidth="10"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease" }} />
      </svg>
      <div style={{ marginTop: -118, height: 118, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 36, fontWeight: 900, fontFamily: "'Playfair Display', serif",
          color: ringColor }}>{consumed}</span>
        <span style={{ fontSize: 12, color: "#6b6560" }}>/ {goal} kcal</span>
        <span style={{ fontSize: 11, color: "#9a9590", marginTop: 4 }}>
          {remaining > 0 ? `还可摄入 ${remaining} kcal` : "已超标"}
        </span>
      </div>
    </div>
  );
}

/* ── 底部导航 ── */
function BottomNav({ tab, setTab }) {
  const items = [
    { id: "scan", icon: "📸", label: "扫描" },
    { id: "diary", icon: "📋", label: "日记" },
    { id: "goal", icon: "🎯", label: "目标" },
    { id: "suggest", icon: "💡", label: "推荐" },
  ];
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: "rgba(10,10,10,0.95)", backdropFilter: "blur(20px)",
      borderTop: "1px solid rgba(255,255,255,0.06)",
      display: "flex", justifyContent: "space-around", padding: "8px 0 env(safe-area-inset-bottom, 8px)",
      zIndex: 100,
    }}>
      {items.map(it => (
        <button key={it.id} onClick={() => setTab(it.id)} style={{
          background: "none", border: "none", cursor: "pointer", padding: "6px 16px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
          opacity: tab === it.id ? 1 : 0.4, transition: "opacity 0.2s",
        }}>
          <span style={{ fontSize: 22 }}>{it.icon}</span>
          <span style={{ fontSize: 10, color: tab === it.id ? "#2A9D8F" : "#9a9590",
            fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{it.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN APP
   ══════════════════════════════════════════════ */
export default function Home() {
  const [tab, setTab] = useState("scan");

  // ── scan state ──
  const [image, setImage] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const fileRef = useRef();

  // ── diary & goal state ──
  const [diary, setDiary] = useState([]);
  const [goal, setGoal] = useState(2000);
  const [goalInput, setGoalInput] = useState("2000");
  const [selectedDate, setSelectedDate] = useState(TODAY());

  // ── suggest state ──
  const [suggestions, setSuggestions] = useState(null);
  const [sugLoading, setSugLoading] = useState(false);

  // Load from localStorage
  useEffect(() => {
    setDiary(loadData("nl_diary", []));
    setGoal(loadData("nl_goal", 2000));
    setGoalInput(String(loadData("nl_goal", 2000)));
  }, []);

  // Save diary
  useEffect(() => { if (diary.length > 0) saveData("nl_diary", diary); }, [diary]);

  const loadingMessages = ["🔍 识别食物中...", "🧪 分析营养成分...", "📊 计算卡路里...", "✨ 生成分析报告..."];

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) { setError("请上传图片文件（JPG / PNG）"); return; }
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
    const interval = setInterval(() => { msgIdx = (msgIdx + 1) % loadingMessages.length; setLoadingMsg(loadingMessages[msgIdx]); }, 2200);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_data: imageData.data, media_type: imageData.media_type }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || "分析失败"); }
      const parsed = await res.json();
      setResult(parsed);
    } catch (e) { setError(e.message || "分析失败，请重试"); }
    finally { clearInterval(interval); setLoading(false); }
  };

  const addToDiary = () => {
    if (!result) return;
    const entry = {
      id: Date.now(),
      date: TODAY(),
      time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      name: result.name,
      name_en: result.name_en,
      calories: result.calories,
      macros: result.macros,
      image: image,
    };
    const newDiary = [entry, ...diary];
    setDiary(newDiary);
    saveData("nl_diary", newDiary);
    setTab("diary");
    // reset scan
    setImage(null); setImageData(null); setResult(null);
  };

  const deleteEntry = (id) => {
    const newDiary = diary.filter(e => e.id !== id);
    setDiary(newDiary);
    saveData("nl_diary", newDiary);
  };

  const saveGoal = () => {
    const v = parseInt(goalInput);
    if (v > 0 && v < 10000) { setGoal(v); saveData("nl_goal", v); }
  };

  // ── diary aggregation ──
  const todayEntries = diary.filter(e => e.date === selectedDate);
  const todayCal = todayEntries.reduce((s, e) => s + e.calories, 0);
  const todayProtein = todayEntries.reduce((s, e) => s + (e.macros?.protein || 0), 0);
  const todayCarbs = todayEntries.reduce((s, e) => s + (e.macros?.carbs || 0), 0);
  const todayFat = todayEntries.reduce((s, e) => s + (e.macros?.fat || 0), 0);

  // ── suggest ──
  const getSuggestions = async () => {
    setSugLoading(true); setSuggestions(null);
    const remaining = Math.max(goal - todayCal, 0);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          suggest_mode: true,
          remaining_calories: remaining,
          eaten_today: todayEntries.map(e => e.name).join("、") || "暂无记录",
          goal: goal,
        }),
      });
      if (!res.ok) throw new Error("获取推荐失败");
      const data = await res.json();
      setSuggestions(data);
    } catch (e) { setError(e.message); }
    finally { setSugLoading(false); }
  };

  const reset = () => { setImage(null); setImageData(null); setResult(null); setError(null); };

  const macroColors = { protein: "#E76F51", carbs: "#F4A261", fat: "#2A9D8F", fiber: "#264653" };
  const scoreColor = (s) => s >= 8 ? "#2A9D8F" : s >= 5 ? "#F4A261" : "#E76F51";
  const nutrientEmojis = ["🥩","🌾","🫒","🥬","🍬","🧂","💊","💧"];
  const nutrientColors = ["#E76F51","#F4A261","#2A9D8F","#264653","#E9C46A","#8ECAE6"];

  // Date navigation
  const shiftDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().slice(0, 10));
  };
  const isToday = selectedDate === TODAY();
  const dateLabel = isToday ? "今天" : selectedDate;

  return (
    <div style={{
      minHeight: "100vh", paddingBottom: 80,
      background: "linear-gradient(160deg, #0a0a0a 0%, #1a1a2e 40%, #16213e 100%)",
      fontFamily: "'DM Sans', sans-serif", color: "#e8e6e3",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* ── Header ── */}
      <div style={{ textAlign: "center", padding: "36px 20px 20px",
        background: "linear-gradient(180deg, rgba(42,157,143,0.08) 0%, transparent 100%)" }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 900, margin: 0,
          background: "linear-gradient(135deg, #e8e6e3, #2A9D8F)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          🍽️ NutriLens
        </h1>
        <p style={{ color: "#9a9590", fontSize: 11, marginTop: 4, letterSpacing: 2, textTransform: "uppercase" }}>
          AI 智能食物营养分析
        </p>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px" }}>

        {/* ════════════ TAB: SCAN ════════════ */}
        {tab === "scan" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            {/* Upload */}
            {!image && (
              <div onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                onClick={() => fileRef.current?.click()}
                style={{ border: `2px dashed ${dragOver ? "#2A9D8F" : "rgba(255,255,255,0.12)"}`,
                  borderRadius: 20, padding: "48px 28px", textAlign: "center", cursor: "pointer",
                  background: dragOver ? "rgba(42,157,143,0.06)" : "rgba(255,255,255,0.03)" }}>
                <input ref={fileRef} type="file" accept="image/*" capture="environment"
                  style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
                <div style={{ fontSize: 48, marginBottom: 12 }}>📸</div>
                <p style={{ fontSize: 15, fontWeight: 600, color: "#e8e6e3", margin: "0 0 6px" }}>拍照或上传食物照片</p>
                <p style={{ fontSize: 12, color: "#6b6560", margin: 0 }}>支持 JPG、PNG 格式</p>
              </div>
            )}

            {/* Preview */}
            {image && !result && (
              <div style={{ animation: "fadeIn 0.4s ease" }}>
                <div style={{ borderRadius: 20, overflow: "hidden", position: "relative",
                  border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 16px 48px rgba(0,0,0,0.3)" }}>
                  <img src={image} alt="food" style={{ width: "100%", height: 260, objectFit: "cover", display: "block" }} />
                  {loading && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
                      <div style={{ width: 40, height: 40, border: "3px solid rgba(255,255,255,0.1)",
                        borderTopColor: "#2A9D8F", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                      <span style={{ fontSize: 14, color: "#e8e6e3" }}>{loadingMsg}</span>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                  <button onClick={reset} style={btnSec}>重新选择</button>
                  <button onClick={analyze} disabled={loading}
                    style={{ ...btnPri, opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}>
                    {loading ? "分析中..." : "🔬 开始分析"}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div style={{ marginTop: 14, padding: "12px 16px", borderRadius: 12,
                background: "rgba(231,111,81,0.1)", border: "1px solid rgba(231,111,81,0.2)",
                color: "#E76F51", fontSize: 13, textAlign: "center" }}>{error}</div>
            )}

            {/* Results */}
            {result && (
              <div style={{ animation: "fadeIn 0.5s ease" }}>
                <div style={{ borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)",
                  marginBottom: 16, boxShadow: "0 16px 48px rgba(0,0,0,0.3)" }}>
                  <div style={{ position: "relative" }}>
                    <img src={image} alt="food" style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }} />
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0,
                      background: "linear-gradient(transparent, rgba(0,0,0,0.85))", padding: "36px 20px 16px" }}>
                      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, margin: 0, fontWeight: 900, color: "#fff" }}>
                        {result.name}</h2>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: "2px 0 0", textTransform: "uppercase", letterSpacing: 1 }}>
                        {result.name_en}</p>
                    </div>
                    <div style={{ position: "absolute", top: 12, right: 12, padding: "4px 10px", borderRadius: 16,
                      background: "rgba(0,0,0,0.6)", fontSize: 11, color: "#2A9D8F", fontWeight: 600 }}>
                      🎯 {result.confidence}%</div>
                  </div>
                  <div style={{ padding: "12px 20px", background: "rgba(255,255,255,0.03)" }}>
                    <p style={{ fontSize: 13, color: "#9a9590", margin: 0 }}>{result.description}</p>
                    <p style={{ fontSize: 11, color: "#6b6560", margin: "4px 0 0" }}>📏 {result.serving_size}</p>
                  </div>
                </div>

                {/* Cals + Score */}
                <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                  <div style={{ ...card, flex: 2, textAlign: "center", padding: 20,
                    background: "linear-gradient(135deg, rgba(42,157,143,0.12), rgba(42,157,143,0.04))",
                    border: "1px solid rgba(42,157,143,0.15)" }}>
                    <span style={labelSm}>总卡路里</span>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 42, fontWeight: 900,
                      color: "#2A9D8F", lineHeight: 1.1, marginTop: 6 }}>{result.calories}</div>
                    <span style={{ fontSize: 13, color: "#9a9590" }}>千卡</span>
                  </div>
                  <div style={{ ...card, flex: 1, textAlign: "center", padding: 20,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span style={labelSm}>健康评分</span>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 38, fontWeight: 900,
                      color: scoreColor(result.health_score), lineHeight: 1.1, marginTop: 6 }}>{result.health_score}</div>
                    <span style={{ fontSize: 12, color: "#9a9590" }}>/10</span>
                  </div>
                </div>

                {/* Macros */}
                <div style={{ ...card, padding: 20, marginBottom: 16 }}>
                  <h3 style={secTitle}>宏量营养素</h3>
                  <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 6 }}>
                    <CircularProgress value={result.macros.protein} max={50} label="蛋白质" color={macroColors.protein} />
                    <CircularProgress value={result.macros.carbs} max={300} label="碳水" color={macroColors.carbs} />
                    <CircularProgress value={result.macros.fat} max={65} label="脂肪" color={macroColors.fat} />
                    <CircularProgress value={result.macros.fiber} max={25} label="纤维" color={macroColors.fiber} size={76} />
                  </div>
                </div>

                {/* Details */}
                {result.details?.length > 0 && (
                  <div style={{ ...card, padding: 20, marginBottom: 16 }}>
                    <h3 style={secTitle}>详细营养成分</h3>
                    {result.details.map((d, i) => (
                      <NutrientBar key={i} name={d.name} value={d.value} unit={d.unit} percent={d.percent}
                        color={nutrientColors[i % nutrientColors.length]} emoji={nutrientEmojis[i % nutrientEmojis.length]} />
                    ))}
                  </div>
                )}

                {/* Tips */}
                {result.tips && (
                  <div style={{ borderRadius: 14, padding: "14px 18px", marginBottom: 16,
                    background: "linear-gradient(135deg, rgba(233,196,106,0.08), rgba(233,196,106,0.02))",
                    border: "1px solid rgba(233,196,106,0.12)" }}>
                    <span style={{ fontSize: 13 }}>💡 </span>
                    <span style={{ fontSize: 13, color: "#9a9590", lineHeight: 1.6 }}>{result.tips}</span>
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                  <button onClick={addToDiary} style={{ ...btnPri, flex: 1 }}>📋 记入日记</button>
                  <button onClick={reset} style={{ ...btnSec, flex: 1 }}>📸 再拍一张</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════ TAB: DIARY ════════════ */}
        {tab === "diary" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            {/* Date navigator */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 16, padding: "0 4px" }}>
              <button onClick={() => shiftDate(-1)} style={navBtn}>◀</button>
              <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Playfair Display', serif", color: "#e8e6e3" }}>
                {dateLabel}
              </span>
              <button onClick={() => shiftDate(1)} style={{ ...navBtn, opacity: isToday ? 0.3 : 1 }}
                disabled={isToday}>▶</button>
            </div>

            {/* Daily summary */}
            <div style={{ ...card, padding: 24, marginBottom: 16, textAlign: "center" }}>
              <DailyRing consumed={todayCal} goal={goal} />
              <div style={{ display: "flex", justifyContent: "space-around", marginTop: 20 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#E76F51", fontFamily: "'Playfair Display', serif" }}>{todayProtein}g</div>
                  <div style={{ fontSize: 10, color: "#6b6560", textTransform: "uppercase", letterSpacing: 1 }}>蛋白质</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#F4A261", fontFamily: "'Playfair Display', serif" }}>{todayCarbs}g</div>
                  <div style={{ fontSize: 10, color: "#6b6560", textTransform: "uppercase", letterSpacing: 1 }}>碳水</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#2A9D8F", fontFamily: "'Playfair Display', serif" }}>{todayFat}g</div>
                  <div style={{ fontSize: 10, color: "#6b6560", textTransform: "uppercase", letterSpacing: 1 }}>脂肪</div>
                </div>
              </div>
            </div>

            {/* Entry list */}
            {todayEntries.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#6b6560" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🍽️</div>
                <p style={{ fontSize: 14, margin: 0 }}>今天还没有记录</p>
                <p style={{ fontSize: 12, margin: "6px 0 0" }}>去「扫描」拍一张食物照片吧</p>
              </div>
            ) : (
              todayEntries.map(entry => (
                <div key={entry.id} style={{ ...card, padding: 0, marginBottom: 10, overflow: "hidden",
                  display: "flex", alignItems: "center" }}>
                  {entry.image && (
                    <img src={entry.image} alt="" style={{ width: 72, height: 72, objectFit: "cover", flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, padding: "10px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#e8e6e3" }}>{entry.name}</span>
                      <span style={{ fontSize: 11, color: "#6b6560" }}>{entry.time}</span>
                    </div>
                    <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                      <span style={{ fontSize: 12, color: "#2A9D8F", fontWeight: 600 }}>{entry.calories} kcal</span>
                      <span style={{ fontSize: 11, color: "#6b6560" }}>
                        蛋白{entry.macros?.protein}g · 碳水{entry.macros?.carbs}g · 脂肪{entry.macros?.fat}g
                      </span>
                    </div>
                  </div>
                  <button onClick={() => deleteEntry(entry.id)} style={{
                    background: "none", border: "none", color: "#6b6560", fontSize: 16,
                    cursor: "pointer", padding: "0 12px", alignSelf: "stretch",
                  }}>✕</button>
                </div>
              ))
            )}
          </div>
        )}

        {/* ════════════ TAB: GOAL ════════════ */}
        {tab === "goal" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ ...card, padding: 24, marginBottom: 16, textAlign: "center" }}>
              <h3 style={{ ...secTitle, marginBottom: 20 }}>每日卡路里目标</h3>
              <DailyRing consumed={todayCal} goal={goal} />
            </div>

            <div style={{ ...card, padding: 20, marginBottom: 16 }}>
              <h3 style={secTitle}>设定目标</h3>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input type="number" value={goalInput} onChange={e => setGoalInput(e.target.value)}
                  style={{ flex: 1, padding: "12px 14px", borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)",
                    color: "#e8e6e3", fontSize: 16, fontFamily: "'Playfair Display', serif",
                    outline: "none",
                  }} />
                <span style={{ fontSize: 13, color: "#6b6560" }}>kcal</span>
                <button onClick={saveGoal} style={{ ...btnPri, flex: "none", padding: "12px 20px" }}>保存</button>
              </div>

              {/* Preset buttons */}
              <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                {[
                  { label: "减脂", val: 1500, desc: "适度减脂" },
                  { label: "维持", val: 2000, desc: "标准摄入" },
                  { label: "增肌", val: 2500, desc: "增肌增重" },
                ].map(p => (
                  <button key={p.val} onClick={() => { setGoalInput(String(p.val)); setGoal(p.val); saveData("nl_goal", p.val); }}
                    style={{ flex: 1, padding: "12px 8px", borderRadius: 10, cursor: "pointer",
                      border: goal === p.val ? "1px solid rgba(42,157,143,0.4)" : "1px solid rgba(255,255,255,0.08)",
                      background: goal === p.val ? "rgba(42,157,143,0.1)" : "rgba(255,255,255,0.03)",
                      textAlign: "center",
                    }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: goal === p.val ? "#2A9D8F" : "#e8e6e3" }}>{p.label}</div>
                    <div style={{ fontSize: 11, color: "#6b6560", marginTop: 2 }}>{p.val} kcal</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Weekly overview */}
            <div style={{ ...card, padding: 20 }}>
              <h3 style={secTitle}>最近 7 天</h3>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", height: 120 }}>
                {Array.from({ length: 7 }).map((_, i) => {
                  const d = new Date(); d.setDate(d.getDate() - 6 + i);
                  const ds = d.toISOString().slice(0, 10);
                  const dayCal = diary.filter(e => e.date === ds).reduce((s, e) => s + e.calories, 0);
                  const pct = goal > 0 ? Math.min(dayCal / goal, 1.3) : 0;
                  const barH = Math.max(pct * 80, 4);
                  const isT = ds === TODAY();
                  const over = dayCal > goal;
                  return (
                    <div key={ds} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 4 }}>
                      <span style={{ fontSize: 10, color: "#6b6560" }}>{dayCal > 0 ? dayCal : ""}</span>
                      <div style={{ width: 20, height: barH, borderRadius: 4,
                        background: over ? "rgba(231,111,81,0.6)" : isT ? "#2A9D8F" : "rgba(42,157,143,0.3)",
                        transition: "height 0.5s ease" }} />
                      <span style={{ fontSize: 10, color: isT ? "#2A9D8F" : "#6b6560", fontWeight: isT ? 700 : 400 }}>
                        {["日","一","二","三","四","五","六"][d.getDay()]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ════════════ TAB: SUGGEST ════════════ */}
        {tab === "suggest" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ ...card, padding: 20, marginBottom: 16, textAlign: "center" }}>
              <h3 style={{ ...secTitle, marginBottom: 8 }}>智能餐食推荐</h3>
              <p style={{ fontSize: 13, color: "#9a9590", margin: "0 0 16px", lineHeight: 1.6 }}>
                根据你今天已摄入 <span style={{ color: "#2A9D8F", fontWeight: 700 }}>{todayCal} kcal</span>，
                还剩 <span style={{ color: "#F4A261", fontWeight: 700 }}>{Math.max(goal - todayCal, 0)} kcal</span> 额度，
                AI 为你推荐合适的餐食搭配
              </p>
              <button onClick={getSuggestions} disabled={sugLoading}
                style={{ ...btnPri, width: "100%", opacity: sugLoading ? 0.6 : 1 }}>
                {sugLoading ? "🤔 思考中..." : "✨ 获取推荐"}
              </button>
            </div>

            {suggestions && (
              <div style={{ animation: "fadeIn 0.4s ease" }}>
                {suggestions.meals?.map((meal, i) => (
                  <div key={i} style={{ ...card, padding: 18, marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "#e8e6e3" }}>
                        {meal.emoji || "🍽️"} {meal.name}
                      </span>
                      <span style={{ fontSize: 13, color: "#2A9D8F", fontWeight: 600 }}>{meal.calories} kcal</span>
                    </div>
                    <p style={{ fontSize: 13, color: "#9a9590", margin: "0 0 10px", lineHeight: 1.5 }}>{meal.description}</p>
                    <div style={{ display: "flex", gap: 12 }}>
                      <span style={{ fontSize: 11, color: "#E76F51" }}>蛋白 {meal.protein}g</span>
                      <span style={{ fontSize: 11, color: "#F4A261" }}>碳水 {meal.carbs}g</span>
                      <span style={{ fontSize: 11, color: "#2A9D8F" }}>脂肪 {meal.fat}g</span>
                    </div>
                  </div>
                ))}
                {suggestions.tip && (
                  <div style={{ borderRadius: 14, padding: "14px 18px",
                    background: "linear-gradient(135deg, rgba(233,196,106,0.08), rgba(233,196,106,0.02))",
                    border: "1px solid rgba(233,196,106,0.12)" }}>
                    <span style={{ fontSize: 13 }}>💡 </span>
                    <span style={{ fontSize: 13, color: "#9a9590", lineHeight: 1.6 }}>{suggestions.tip}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav tab={tab} setTab={setTab} />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        *, *::before, *::after { box-sizing: border-box; }
        button:hover { filter: brightness(1.08); }
        input:focus { border-color: rgba(42,157,143,0.4) !important; }
      `}</style>
    </div>
  );
}

/* ── Shared Styles ── */
const card = { borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" };
const labelSm = { fontSize: 10, color: "#6b6560", textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600 };
const secTitle = { fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "#6b6560", margin: "0 0 16px", fontWeight: 600 };
const btnPri = { padding: "12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #2A9D8F, #1a6b5a)",
  color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
  boxShadow: "0 4px 16px rgba(42,157,143,0.25)" };
const btnSec = { padding: "12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.03)", color: "#e8e6e3", fontSize: 13, fontWeight: 600,
  cursor: "pointer", fontFamily: "'DM Sans', sans-serif", flex: 1 };
const navBtn = { background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
  color: "#9a9590", fontSize: 14, padding: "6px 14px", cursor: "pointer" };
