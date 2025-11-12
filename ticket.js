import {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionsBitField,
} from "discord.js";
import fs from "fs";
import path from "path";

const TICKET_CATEGORY_ID = "1437143390105112586";
const LOG_CHANNEL_ID = "1411356987953905805";

let ticketCounter = 1;

export async function setupTicket(client) {
  client.on("messageCreate", async (msg) => {
    if (msg.author.bot) return;

    if (msg.content === "!티켓") {
      const embed = new EmbedBuilder()
        .setColor("#2a5034")
        .setTitle("<:ROKA:1437150986450899024> 수동인증 요청 티켓")
        .setDescription(
          "본인이 만 8세 미만의 아동이거나, 인증과정 중 문제가 있을 경우 이용해 주시기 바랍니다. " +
          "수동인증은 인증요청시각 기준으로 12시간 내 완료됩니다."
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("open_ticket")
          .setLabel("📩 티켓 열기")
          .setStyle(ButtonStyle.Secondary)
      );

      return msg.channel.send({ embeds: [embed], components: [row] });
    }
  });

  client.on("interactionCreate", async (interaction) => {
    // 티켓 열기 모달
    if (interaction.isButton() && interaction.customId === "open_ticket") {
      const modal = new ModalBuilder()
        .setCustomId("ticket_modal")
        .setTitle("수동인증 요청하기");

      const discordNameInput = new TextInputBuilder()
        .setCustomId("discord_name")
        .setLabel("본인의 Discord 이름을 알려주세요.")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const robloxNameInput = new TextInputBuilder()
        .setCustomId("roblox_name")
        .setLabel("본인의 Roblox 이름을 알려주세요.")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const confirmationInput = new TextInputBuilder()
        .setCustomId("confirmation")
        .setLabel("장난으로 티켓을 열지 않겠습니다.")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(discordNameInput),
        new ActionRowBuilder().addComponents(robloxNameInput),
        new ActionRowBuilder().addComponents(confirmationInput)
      );

      return interaction.showModal(modal);
    }

    // 모달 제출 후 티켓 채널 생성
    if (interaction.isModalSubmit() && interaction.customId === "ticket_modal") {
      await interaction.reply({ content: "*⏳ 티켓생성중...*", ephemeral: true });

      setTimeout(async () => {
        const discordName = interaction.fields.getTextInputValue("discord_name");
        const robloxName = interaction.fields.getTextInputValue("roblox_name");
        const prankConfirm = interaction.fields.getTextInputValue("confirmation");

        const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
        const ticketName = `수동인증요청-${interaction.user.username}-${randomNum}`;
        
        const ticketChannel = await interaction.guild.channels.create({
          name: ticketName,
          type: 0, // text channel
          parent: TICKET_CATEGORY_ID,
          permissionOverwrites: [
            {
              id: interaction.guild.id,
              deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
              id: interaction.user.id,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.AttachFiles,
                PermissionsBitField.Flags.EmbedLinks,
              ],
            },
            {
              id: "1427689762902511616", // 역할 ID 예시
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.AttachFiles,
                PermissionsBitField.Flags.EmbedLinks,
              ],
            },
          ],
        });

        await interaction.editReply({
          content: `*${interaction.user}님 '수동인증요청' 티켓이 생성되었습니다. <#${ticketChannel.id}> 로 이동하세요.*`,
        });

        const ticketEmbed = new EmbedBuilder()
          .setColor("#2a5034")
          .setTitle("수동인증요청")
          .addFields(
            { name: "요청자", value: `${interaction.user.tag}` },
            { name: "디스코드", value: discordName },
            { name: "로블록스", value: robloxName },
            { name: "장난으로 티켓을 열지 않겠습니다.", value: prankConfirm }
          );

        const closeRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("close_ticket")
            .setLabel("📩 티켓닫기")
            .setStyle(ButtonStyle.Danger)
        );

        await ticketChannel.send({ embeds: [ticketEmbed], components: [closeRow] });
      }, 2000);

      return;
    }

    // 티켓 닫기 버튼
    if (interaction.isButton() && interaction.customId === "close_ticket") {
      const channel = interaction.channel;

      // 메시지 100개까지 로드
      const messages = await channel.messages.fetch({ limit: 100 });
      const lines = messages
        .reverse()
        .map(m => {
          const timestamp = new Date(m.createdAt.getTime() + 9 * 60 * 60 * 1000)
            .toISOString()
            .replace("T", " ")
            .split(".")[0];

          // 기본: 작성자 태그
          const authorTag = m.author.tag;

          let lineContent = m.content;

          // 임베드가 존재하면 추가 정보 반영
          if (m.embeds.length > 0) {
            const embed = m.embeds[0];
            const discordName = embed.fields?.find(f => f.name === "디스코드")?.value ?? "";
            const robloxName = embed.fields?.find(f => f.name === "로블록스")?.value ?? "";
            if (discordName || robloxName) {
              lineContent = `${discordName}(${m.author.id}), ${robloxName}`;
            }
          }

          return `[${timestamp}] ${authorTag} : ${lineContent}`;
        })
        .join("\n");

      const fileName = `${channel.name}_log.txt`;
      const filePath = path.join(process.cwd(), fileName);
      fs.writeFileSync(filePath, lines, "utf‑8");

      // 로그 채널에 파일 전송
      const logChannel = await interaction.guild.channels.fetch(LOG_CHANNEL_ID);
      await logChannel.send({ content: `#${channel.name} 채팅로그`, files: [filePath] });

      // 파일 삭제
      fs.unlinkSync(filePath);

      // 채널 삭제 또는 권한 차단
      await channel.delete();
      return;
    }

  });
}
