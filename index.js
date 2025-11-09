// ================================
// 1️⃣ 환경 설정
// ================================
import "dotenv/config";
import { Client, GatewayIntentBits, Partials, EmbedBuilder, ActivityType } from "discord.js";
import express from "express";

// auth.js와 ticket.js import
import { setupAuth } from "./auth.js";
import { setupTicket } from "./ticket.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.GuildMember],
});

const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

// 역할 ID 설정
const ROLE1 = '1437054700233953340'; // 제거할 역할
const ROLE2 = '1426570497713373194'; // 유지할 역할

// ================================
// 2️⃣ 입장 로그
// ================================
client.on("guildMemberAdd", async (member) => {
  console.log("👋 멤버 입장:", member.user.tag);

  const logChannel = member.guild.channels.cache.get(LOG_CHANNEL_ID);
  if (!logChannel) return console.log("❌ 로그 채널을 찾을 수 없음");

  const embed = new EmbedBuilder()
    .setTitle("멤버가 입장했습니다!")
    .setColor("#00bcd4")
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: "유저", value: `${member.user}`, inline: true },
      { name: "입장 시간", value: `<t:${Math.floor(Date.now() / 1000)}:F>` }
    );

  await logChannel.send({ embeds: [embed] });
});

// ================================
// 3️⃣ 퇴장 로그
// ================================
client.on("guildMemberRemove", async (member) => {
  console.log("❌ 멤버 퇴장:", member.user.tag);

  const logChannel = member.guild.channels.cache.get(LOG_CHANNEL_ID);
  if (!logChannel) return console.log("❌ 로그 채널을 찾을 수 없음");

  const embed = new EmbedBuilder()
    .setTitle("멤버가 퇴장했습니다.")
    .setColor("#d91e18")
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: "유저", value: `${member.user}`, inline: true },
      { name: "퇴장 시간", value: `<t:${Math.floor(Date.now() / 1000)}:F>` }
    );

  await logChannel.send({ embeds: [embed] });
});

// ================================
// 4️⃣ 역할 자동 정리 (roll.js 기능)
// ================================
client.on("guildMemberUpdate", async (oldMember, newMember) => {
  try {
    if (newMember.roles.cache.has(ROLE1) && newMember.roles.cache.has(ROLE2)) {
      await newMember.roles.remove(ROLE1);
      console.log(`✅ Removed role1 from ${newMember.user.tag} because they also have role2.`);
    }
  } catch (err) {
    console.error(`⚠️ 역할 제거 오류: ${err.message}`);
  }
});

// ================================
// 5️⃣ 상태 메시지 자동 변경
// ================================
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);

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

  // auth.js와 ticket.js 실행
  setupAuth(client);
  setupTicket(client);
});

// ================================
// 6️⃣ 웹서버
// ================================
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => res.send("봇이 정상 실행 중입니다!"));

app.listen(PORT, () => console.log(`✅ 서버 실행 중: http://localhost:${PORT}`));

// ================================
// 7️⃣ 로그인
// ================================
client.login(process.env.DISCORD_TOKEN);

