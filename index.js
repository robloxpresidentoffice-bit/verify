// ================================
// 📦 기본 모듈
// ================================
import "dotenv/config";
import { Client, GatewayIntentBits, Partials, ActivityType } from "discord.js";
import { setupAuth } from "./auth.js";

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
// 🪄 봇이 준비되면 실행
// ================================
client.once("ready", async () => {
  console.log(`✅ 로그인 성공: ${client.user.tag}`);

  // ───────────────────────────────
      // ② 상태 주기적 변경 (5초마다)
      // ───────────────────────────────
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
          logError(`상태 변경 오류: ${err.message}`);
        }
      }, 5000);


  // 인증 시스템 세팅
  await setupAuth(client);
});

// ================================
// 🚀 로그인
// ================================
client.login(process.env.DISCORD_TOKEN).catch((err) => {
  console.error("❌ 로그인 실패:", err);
});
