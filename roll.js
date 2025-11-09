// roll.js
import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

const ROLE_ID1 = '1437054700233953340';
const ROLE_ID2 = '1426570497713373194';

client.on('guildMemberUpdate', async (oldMember, newMember) => {
  try {
    const hasRole1 = newMember.roles.cache.has(ROLE_ID1);
    const hasRole2 = newMember.roles.cache.has(ROLE_ID2);

    if (hasRole1 && hasRole2) {
      // Role ID1 제거
      await newMember.roles.remove(ROLE_ID1);
      console.log(`✅ Role ID1 제거됨: ${newMember.user.tag}`);

      // 서버별 닉네임 초기화
      if (newMember.nickname) {
        await newMember.setNickname(null);
        console.log(`🔹 닉네임 초기화됨: ${newMember.user.tag}`);
      }
    }
  } catch (err) {
    console.error(err);
  }
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
