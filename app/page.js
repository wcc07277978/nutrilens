"use client";

import { useState, useRef, useCallback } from "react";

/* ── 环形进度条 ─────────────────────────────── */
function CircularProgress({ value, max, label, color, unit = "g", size = 90 }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const offset = circ * (1 - pct);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
      }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="5"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div
        style={{
          marginTop: -size / 2 - 12,
          textAlign: "center",
          height: size / 2 + 12,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: 20,
            fontWeight: 700,
            fontFamily: "'Playfair Display', serif",
            color: "#e8e6e3",
          }}
        >
          {value}
        </span>
        <span style={{ fontSize: 10, color: "#6b6560", letterSpacing: 0.5 }}>
          {unit}
        </span>
      </div>
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#9a9590",
          textTransform: "uppercase",
          letterSpacing: 1.2,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {label}
      </span>
    </div>
  );
}

/* ── 营养素条 ──────────────────────────────── */
function NutrientBar({ name, value, unit, percent, color, emoji }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 0",
      }}
    >
      <span style={{ fontSize: 18, width: 26, textAlign: "center" }}>
        {emoji}
      </span>
      <div style={{ flex: 1 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 4,
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#e8e6e3",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {name}
          </span>
          <span
            style={{
              fontSize: 13,
              color: "#9a9590",
              fontFamily: "'Playfair Display', serif",
            }}
          >
            {value}
            {unit}
          </span>
        </div>
        <div
          style={{
            height: 5,
            borderRadius: 3,
            background: "rgba(255,255,255,0.06)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              borderRadius: 3,
              background: color,
              width: `${Math.min(percent, 100)}%`,
              transition: "width 1s ease",
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ── 主应用 ────────────────────────────────── */
export default function Home() {
  const [image, setImage] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const fileRef = useRef();

  const loadingMessages = [
    "🔍 识别食物中...",
    "🧪 分析营养成分...",
    "📊 计算卡路里...",
    "✨ 生成分析报告...",
  ];

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) {
      setError("请上传图片文件（JPG / PNG）");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("图片不能超过 10 MB");
      return;
    }
    setError(null);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target.result);
      const base64 = e.target.result.split(",")[1];
      setImageData({ data: base64, media_type: file.type });
    };
    reader.readAsDataURL(file);
  }, []);

  const analyze = async () => {
    if (!imageData) return;
    setLoading(true);
    setError(null);

    let msgIdx = 0;
    setLoadingMsg(loadingMessages[0]);
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % loadingMessages.length;
      setLoadingMsg(loadingMessages[msgIdx]);
    }, 2200);

    try {
      // 调用我们自己的后端接口（不是直接调 Anthropic）
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_data: imageData.data,
          media_type: imageData.media_type,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || "分析失败");
      }

      const parsed = await res.json();
      setResult(parsed);
    } catch (e) {
      console.error(e);
      setError(e.message || "分析失败，请重试。确保上传的是清晰的食物照片。");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const reset = () => {
    setImage(null);
    setImageData(null);
    setResult(null);
    setError(null);
  };

  const macroColors = {
    protein: "#E76F51",
    carbs: "#F4A261",
    fat: "#2A9D8F",
    fiber: "#264653",
  };
  const scoreColor = (s) =>
    s >= 8 ? "#2A9D8F" : s >= 5 ? "#F4A261" : "#E76F51";
  const nutrientEmojis = ["🥩", "🌾", "🫒", "🥬", "🍬", "🧂", "💊", "💧"];
  const nutrientColors = [
    "#E76F51",
    "#F4A261",
    "#2A9D8F",
    "#264653",
    "#E9C46A",
    "#8ECAE6",
  ];

  /* ── styles ── */
  const pageStyle = {
    minHeight: "100vh",
    background: "linear-gradient(160deg, #0a0a0a 0%, #1a1a2e 40%, #16213e 100%)",
    fontFamily: "'DM Sans', sans-serif",
    color: "#e8e6e3",
  };

  return (
    <div style={pageStyle}>
      {/* ── Header ── */}
      <div
        style={{
          textAlign: "center",
          padding: "48px 20px 28px",
          background:
            "linear-gradient(180deg, rgba(42,157,143,0.08) 0%, transparent 100%)",
        }}
      >
        <div style={{ fontSize: 44, marginBottom: 6 }}>🍽️</div>
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 34,
            fontWeight: 900,
            margin: 0,
            background: "linear-gradient(135deg, #e8e6e3, #2A9D8F)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: -1,
          }}
        >
          NutriLens
        </h1>
        <p
          style={{
            color: "#9a9590",
            fontSize: 13,
            marginTop: 8,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          AI 智能食物营养分析
        </p>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px 60px" }}>
        {/* ── Upload ── */}
        {!image && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFile(e.dataTransfer.files[0]);
            }}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? "#2A9D8F" : "rgba(255,255,255,0.12)"}`,
              borderRadius: 20,
              padding: "56px 32px",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.3s ease",
              background: dragOver
                ? "rgba(42,157,143,0.06)"
                : "rgba(255,255,255,0.03)",
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: "none" }}
              onChange={(e) => handleFile(e.target.files[0])}
            />
            <div style={{ fontSize: 52, marginBottom: 14 }}>📸</div>
            <p
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#e8e6e3",
                margin: "0 0 8px",
              }}
            >
              拍照或上传食物照片
            </p>
            <p style={{ fontSize: 13, color: "#6b6560", margin: 0 }}>
              支持 JPG、PNG 格式 · 点击或拖拽上传
            </p>
          </div>
        )}

        {/* ── Preview + Buttons ── */}
        {image && !result && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <div
              style={{
                borderRadius: 20,
                overflow: "hidden",
                position: "relative",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              }}
            >
              <img
                src={image}
                alt="food"
                style={{
                  width: "100%",
                  height: 280,
                  objectFit: "cover",
                  display: "block",
                }}
              />
              {loading && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0,0,0,0.7)",
                    backdropFilter: "blur(8px)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 20,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      border: "3px solid rgba(255,255,255,0.1)",
                      borderTopColor: "#2A9D8F",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  <span
                    style={{ fontSize: 15, color: "#e8e6e3", fontWeight: 500 }}
                  >
                    {loadingMsg}
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <button onClick={reset} style={btnSecondary}>
                重新选择
              </button>
              <button
                onClick={analyze}
                disabled={loading}
                style={{
                  ...btnPrimary,
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "分析中..." : "🔬 开始分析"}
              </button>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div
            style={{
              marginTop: 16,
              padding: "14px 18px",
              borderRadius: 12,
              background: "rgba(231,111,81,0.1)",
              border: "1px solid rgba(231,111,81,0.2)",
              color: "#E76F51",
              fontSize: 14,
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        {/* ── Results ── */}
        {result && (
          <div style={{ animation: "fadeIn 0.5s ease" }}>
            {/* Hero image + name */}
            <div
              style={{
                borderRadius: 20,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.08)",
                marginBottom: 20,
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              }}
            >
              <div style={{ position: "relative" }}>
                <img
                  src={image}
                  alt="food"
                  style={{
                    width: "100%",
                    height: 220,
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background:
                      "linear-gradient(transparent, rgba(0,0,0,0.85))",
                    padding: "40px 24px 20px",
                  }}
                >
                  <h2
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 26,
                      margin: 0,
                      fontWeight: 900,
                      color: "#fff",
                    }}
                  >
                    {result.name}
                  </h2>
                  <p
                    style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.5)",
                      margin: "4px 0 0",
                      textTransform: "uppercase",
                      letterSpacing: 1.5,
                    }}
                  >
                    {result.name_en}
                  </p>
                </div>
                <div
                  style={{
                    position: "absolute",
                    top: 14,
                    right: 14,
                    padding: "5px 11px",
                    borderRadius: 20,
                    background: "rgba(0,0,0,0.6)",
                    backdropFilter: "blur(10px)",
                    fontSize: 12,
                    color: "#2A9D8F",
                    fontWeight: 600,
                  }}
                >
                  🎯 {result.confidence}%
                </div>
              </div>
              <div
                style={{
                  padding: "14px 24px",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <p style={{ fontSize: 14, color: "#9a9590", margin: 0 }}>
                  {result.description}
                </p>
                <p
                  style={{ fontSize: 12, color: "#6b6560", margin: "6px 0 0" }}
                >
                  📏 份量：{result.serving_size}
                </p>
              </div>
            </div>

            {/* Calories + Score */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              <div style={{ ...card, flex: 2, textAlign: "center", padding: 24,
                background: "linear-gradient(135deg, rgba(42,157,143,0.12), rgba(42,157,143,0.04))",
                border: "1px solid rgba(42,157,143,0.15)" }}>
                <span style={labelSmall}>总卡路里</span>
                <div
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 48,
                    fontWeight: 900,
                    color: "#2A9D8F",
                    lineHeight: 1.1,
                    marginTop: 8,
                  }}
                >
                  {result.calories}
                </div>
                <span style={{ fontSize: 14, color: "#9a9590" }}>
                  千卡 (kcal)
                </span>
              </div>
              <div
                style={{
                  ...card,
                  flex: 1,
                  textAlign: "center",
                  padding: 24,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={labelSmall}>健康评分</span>
                <div
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 42,
                    fontWeight: 900,
                    color: scoreColor(result.health_score),
                    lineHeight: 1.1,
                    marginTop: 8,
                  }}
                >
                  {result.health_score}
                </div>
                <span style={{ fontSize: 13, color: "#9a9590" }}>/10</span>
              </div>
            </div>

            {/* Macros */}
            <div style={{ ...card, padding: 24, marginBottom: 20 }}>
              <h3 style={sectionTitle}>宏量营养素</h3>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-around",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <CircularProgress
                  value={result.macros.protein}
                  max={50}
                  label="蛋白质"
                  color={macroColors.protein}
                />
                <CircularProgress
                  value={result.macros.carbs}
                  max={300}
                  label="碳水"
                  color={macroColors.carbs}
                />
                <CircularProgress
                  value={result.macros.fat}
                  max={65}
                  label="脂肪"
                  color={macroColors.fat}
                />
                <CircularProgress
                  value={result.macros.fiber}
                  max={25}
                  label="膳食纤维"
                  color={macroColors.fiber}
                  size={76}
                />
              </div>
            </div>

            {/* Details */}
            {result.details?.length > 0 && (
              <div style={{ ...card, padding: 24, marginBottom: 20 }}>
                <h3 style={sectionTitle}>详细营养成分</h3>
                {result.details.map((d, i) => (
                  <NutrientBar
                    key={i}
                    name={d.name}
                    value={d.value}
                    unit={d.unit}
                    percent={d.percent}
                    color={nutrientColors[i % nutrientColors.length]}
                    emoji={nutrientEmojis[i % nutrientEmojis.length]}
                  />
                ))}
              </div>
            )}

            {/* Tips */}
            {result.tips && (
              <div
                style={{
                  borderRadius: 16,
                  padding: "18px 22px",
                  marginBottom: 20,
                  background:
                    "linear-gradient(135deg, rgba(233,196,106,0.08), rgba(233,196,106,0.02))",
                  border: "1px solid rgba(233,196,106,0.12)",
                }}
              >
                <span style={{ fontSize: 14 }}>💡 </span>
                <span
                  style={{ fontSize: 14, color: "#9a9590", lineHeight: 1.6 }}
                >
                  {result.tips}
                </span>
              </div>
            )}

            <button onClick={reset} style={{ ...btnSecondary, width: "100%" }}>
              📸 分析另一张照片
            </button>
          </div>
        )}
      </div>

      {/* ── Global CSS ── */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        *, *::before, *::after { box-sizing: border-box; }
        button:hover { filter: brightness(1.1); }
      `}</style>
    </div>
  );
}

/* ── Shared styles ── */
const card = {
  borderRadius: 16,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const labelSmall = {
  fontSize: 11,
  color: "#6b6560",
  textTransform: "uppercase",
  letterSpacing: 1.5,
  fontWeight: 600,
};

const sectionTitle = {
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: 2,
  color: "#6b6560",
  margin: "0 0 18px",
  fontWeight: 600,
};

const btnPrimary = {
  flex: 2,
  padding: "14px",
  borderRadius: 12,
  border: "none",
  background: "linear-gradient(135deg, #2A9D8F, #1a6b5a)",
  color: "#fff",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "'DM Sans', sans-serif",
  boxShadow: "0 4px 20px rgba(42,157,143,0.3)",
};

const btnSecondary = {
  flex: 1,
  padding: "14px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.03)",
  color: "#e8e6e3",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "'DM Sans', sans-serif",
};
