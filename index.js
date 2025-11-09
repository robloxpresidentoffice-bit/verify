// ================================
// 📦 기본 모듈
// ================================
import "dotenv/config";
import express from "express"; // 포트용
import { Client, GatewayIntentBits, Partials, ActivityType } from "discord.js";
import { setupAuth } from "./auth.js";
import { setupTicket } from "./ticket.js";

// ================================
// ⚙️ 클라이언트 설정
// ================================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

// ================================
// 🪄 봇 준비
// ================================
client.once("ready", async () => {
  console.log(`✅ 로그인 성공: ${client.user.tag}`);

  const statuses = [
    { name: '디엠으로 "안녕"을 보내보세요', state: '🪖 전격부대에 입대 해보세요!' },
    { name: '테스트 단계', state: '🛰️ 인증 시스템 정상작동중' },
  ];

  let index = 0;
  setInterval(() => {
    try {
      const status = statuses[index];
      client.user.setPresence({
        activities: [{ name: status.name, type: ActivityType.Custom, state: status.state }],
        status: 'online',
      });
      index = (index + 1) % statuses.length;
    } catch (err) {
      console.error(`상태 변경 오류: ${err.message}`);
    }
  }, 30000);

  await setupAuth(client);
  await setupTicket(client);

  // ================================
  // 🌐 Express 서버 (포트 바인딩)
  // ================================
  const app = express();

  app.get("/", (req, res) => {
    res.send("ROKA Verify Bot is running!");
  });

  const PORT = process.env.PORT || 3000; // Render에서 자동으로 할당된 포트 사용
  app.listen(PORT, () => {
    console.log(`🌐 서버 포트 열림: ${PORT}`);
  });
});

// ================================
// 🚀 로그인
// ================================
client.login(process.env.DISCORD_TOKEN).catch((err) => {
  console.error("❌ 로그인 실패:", err);
});
