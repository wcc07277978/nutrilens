// app/api/analyze/route.js
// 后端接口 — 支持食物分析 + 餐食推荐

export async function POST(request) {
  try {
    const body = await request.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "服务器未配置 API Key，请联系管理员" },
        { status: 500 }
      );
    }

    // ── 模式判断：餐食推荐 or 食物分析 ──
    if (body.suggest_mode) {
      return handleSuggestion(body, apiKey);
    } else {
      return handleAnalysis(body, apiKey);
    }
  } catch (error) {
    console.error("Server error:", error);
    return Response.json({ error: "处理失败，请重试" }, { status: 500 });
  }
}

// ── 食物分析 ──
async function handleAnalysis(body, apiKey) {
  const { image_data, media_type } = body;

  if (!image_data || !media_type) {
    return Response.json({ error: "缺少图片数据" }, { status: 400 });
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type, data: image_data },
            },
            {
              type: "text",
              text: `分析这张食物照片。返回纯JSON，不要markdown backticks和任何其他文本。格式:
{
  "name": "食物名称(中文)",
  "name_en": "English name",
  "description": "简短描述(中文,30字以内)",
  "calories": 数字(千卡),
  "serving_size": "份量描述(中文)",
  "confidence": 0到100的置信度,
  "macros": {
    "protein": 数字(克),
    "carbs": 数字(克),
    "fat": 数字(克),
    "fiber": 数字(克)
  },
  "details": [
    {"name": "营养素名称", "value": 数字, "unit": "单位", "percent": 每日推荐占比百分比数字}
  ],
  "health_score": 1到10的健康评分,
  "tips": "一句简短的饮食建议(中文)"
}`,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    console.error("Anthropic API error:", await response.text());
    return Response.json({ error: "AI 分析服务暂时不可用" }, { status: 502 });
  }

  const data = await response.json();
  const text = data.content?.map((c) => c.text || "").join("") || "";
  const clean = text.replace(/```json|```/g, "").trim();
  const result = JSON.parse(clean);
  return Response.json(result);
}

// ── 餐食推荐 ──
async function handleSuggestion(body, apiKey) {
  const { remaining_calories, eaten_today, goal } = body;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `作为营养师，根据以下信息推荐餐食搭配。

用户今日已吃: ${eaten_today}
每日目标: ${goal} kcal
剩余额度: ${remaining_calories} kcal

请推荐 3 个适合的餐食选择，每个都要在剩余卡路里额度内。要多样化、营养均衡、实际可做/可买的食物。

返回纯JSON，不要markdown backticks和任何其他文本。格式:
{
  "meals": [
    {
      "emoji": "对应的食物emoji",
      "name": "餐食名称(中文)",
      "description": "简短描述，包含具体食材(中文,50字以内)",
      "calories": 数字(千卡),
      "protein": 数字(克),
      "carbs": 数字(克),
      "fat": 数字(克)
    }
  ],
  "tip": "一句根据用户今日饮食情况给出的个性化建议(中文)"
}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    console.error("Anthropic API error:", await response.text());
    return Response.json({ error: "AI 推荐服务暂时不可用" }, { status: 502 });
  }

  const data = await response.json();
  const text = data.content?.map((c) => c.text || "").join("") || "";
  const clean = text.replace(/```json|```/g, "").trim();
  const result = JSON.parse(clean);
  return Response.json(result);
}
