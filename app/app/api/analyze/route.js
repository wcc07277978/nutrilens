// app/api/analyze/route.js
// 后端接口 — API Key 安全地存在服务器端，用户看不到

export async function POST(request) {
  try {
    const { image_data, media_type } = await request.json();

    if (!image_data || !media_type) {
      return Response.json({ error: "缺少图片数据" }, { status: 400 });
    }

    // 从环境变量读取 API Key（安全！用户无法看到）
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "服务器未配置 API Key，请联系管理员" },
        { status: 500 }
      );
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
                source: {
                  type: "base64",
                  media_type: media_type,
                  data: image_data,
                },
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
      const errorData = await response.text();
      console.error("Anthropic API error:", errorData);
      return Response.json(
        { error: "AI 分析服务暂时不可用，请稍后再试" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const text = data.content?.map((c) => c.text || "").join("") || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);

    return Response.json(result);
  } catch (error) {
    console.error("Server error:", error);
    return Response.json({ error: "分析失败，请重试" }, { status: 500 });
  }
}
