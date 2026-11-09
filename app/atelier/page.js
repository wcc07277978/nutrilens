import Atelier from "./atelier";

export const metadata = {
  title: "月梅 — AI 辅助绘画",
  description: "一段很短的动画：人先落墨，AI 读形、起稿、敷色，再由人收笔。",
  other: { google: "notranslate" },
};

export default function Page() {
  return <Atelier />;
}
