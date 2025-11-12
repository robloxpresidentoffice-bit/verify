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
  ChannelType,
} from "discord.js";
import fs from "fs";
import path from "path";

const TICKET_CATEGORY_ID = "1437143390105112586";
const LOG_CHANNEL_ID = "1411356987953905805";

export async function setupTicket(client) {
  // !티켓 명령어
  client.on("messageCreate", async (msg) => {
    if (msg.author.bot) return;

    if (msg.content === "!티켓") {
      const embed = new EmbedBuilder()
        .setColor("#2a5034")
        .setTitle("<:ROKA:1437150986450899024> 수동인증 요청 티켓")
        .setDescription(
          "본인이 만 8세 미만의 아동이거나, 인증과정 중 문제가 있을 경우 이용해 주시기 바랍니다.\n" +
            "수동인증은 인증요청시각 기준으로 12시간 내 완료됩니다."
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("open_ticket")
          .setLabel("📩 티켓 열기")
          .setStyle(ButtonStyle.Secondary)
      );

      await msg.channel.send({ embeds: [embed], components: [row] });
    }
  });

  // interaction 처리
  client.on("interactionCreate", async (interaction) => {
    // ✅ 티켓 열기
    if (interaction.isButton() && interaction.customId === "open_ticket") {
      try {
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

        await interaction.showModal(modal);
      } catch (err) {
        console.error("❌ 모달 표시 중 오류:", err);
        if (!interaction.replied) {
          await interaction.reply({
            content: "⚠️ 티켓 모달을 표시할 수 없습니다. 잠시 후 다시 시도해주세요.",
            ephemeral: true,
          });
        }
      }
      return;
    }

    // ✅ 티켓 생성
    if (interaction.isModalSubmit() && interaction.customId === "ticket_modal") {
      await interaction.reply({
        content: "⏳ 티켓을 생성 중입니다...",
        ephemeral: true,
      });

      try {
        const discordName = interaction.fields.getTextInputValue("discord_name");
        const robloxName = interaction.fields.getTextInputValue("roblox_name");
        const prankConfirm = interaction.fields.getTextInputValue("confirmation");

        const randomNum = Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, "0");

        // ✅ 유저 ID 포함 (닫기 시 정확한 권한 제거용)
        const ticketName = `수동인증요청-${interaction.user.id}-${randomNum}`;

        const ticketChannel = await interaction.guild.channels.create({
          name: ticketName,
          type: ChannelType.GuildText,
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
              id: "1427689762902511616", // 관리자 역할 ID
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
          content: `✅ ${interaction.user}님, 티켓이 생성되었습니다!\n<#${ticketChannel.id}>로 이동하세요.`,
        });

        const ticketEmbed = new EmbedBuilder()
          .setColor("#2a5034")
          .setTitle("수동인증 요청")
          .addFields(
            { name: "요청자", value: `${interaction.user.tag}`, inline: true },
            { name: "디스코드 이름", value: discordName, inline: true },
            { name: "로블록스 이름", value: robloxName, inline: true },
            { name: "장난 방지 확인", value: prankConfirm }
          );

        const closeRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("close_ticket")
            .setLabel("📩 티켓 닫기")
            .setStyle(ButtonStyle.Danger)
        );

        await ticketChannel.send({
          content: `${interaction.user}님이 수동인증 요청 티켓을 생성했습니다.`,
          embeds: [ticketEmbed],
          components: [closeRow],
        });
      } catch (err) {
        console.error("❌ 티켓 생성 중 오류:", err);
        await interaction.editReply({
          content: "⚠️ 티켓 생성 중 오류가 발생했습니다. 관리자에게 문의하세요.",
        });
      }

      return;
    }

    // ✅ 티켓 닫기
    if (interaction.isButton() && interaction.customId === "close_ticket") {
      try {
        const channel = interaction.channel;
        const guild = interaction.guild;

        const ticketOwnerId = channel.name.split("-")[1];
        const member = guild.members.cache.get(ticketOwnerId);

        // 생성자 보기권한 제거
        if (member) {
          await channel.permissionOverwrites.edit(member.id, {
            ViewChannel: false,
            SendMessages: false,
          });
        }

        // 닫기 버튼 비활성화
        await interaction.update({
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("closed_button")
                .setLabel("티켓 닫힘")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true)
            ),
          ],
        });

        // 삭제 버튼 메시지 전송
        await channel.send({
          content: `🔒 **${member ? member.displayName : "사용자"}** 님이 티켓을 닫았어요.\n티켓을 삭제할까요?`,
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("delete_ticket")
                .setLabel("🗑️ 삭제하기")
                .setStyle(ButtonStyle.Danger)
            ),
          ],
        });
      } catch (err) {
        console.error("❌ 티켓 닫기 중 오류:", err);
        if (!interaction.replied) {
          await interaction.reply({
            content: "⚠️ 티켓 닫는 중 오류가 발생했습니다.",
            ephemeral: true,
          });
        }
      }
      return;
    }

    // ✅ 티켓 삭제
    if (interaction.isButton() && interaction.customId === "delete_ticket") {
      try {
        const channel = interaction.channel;
        const guild = interaction.guild;

        // 로그 수집
        const messages = await channel.messages.fetch({ limit: 100 });
        const lines = messages
          .reverse()
          .map((m) => {
            const timestamp = new Date(m.createdAt.getTime() + 9 * 60 * 60 * 1000)
              .toISOString()
              .replace("T", " ")
              .split(".")[0];
            const authorTag = m.author?.tag ?? "시스템";
            return `[${timestamp}] ${authorTag}: ${m.content}`;
          })
          .join("\n");

        const fileName = `${channel.name}_log.txt`;
        const filePath = path.join(process.cwd(), fileName);
        fs.writeFileSync(filePath, lines, "utf-8");

        // 로그 채널에 전송
        const logChannel = await guild.channels.fetch(LOG_CHANNEL_ID);
        await logChannel.send({
          content: `🗑️ **${channel.name}** 채널 로그`,
          files: [filePath],
        });

        fs.unlinkSync(filePath); // 임시 파일 삭제
        await channel.delete(); // 채널 삭제
      } catch (err) {
        console.error("❌ 티켓 삭제 중 오류:", err);
        if (!interaction.replied) {
          await interaction.reply({
            content: "⚠️ 티켓 삭제 중 오류가 발생했습니다.",
            ephemeral: true,
          });
        }
      }
      return;
    }
  });
}

  });
}
