import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionsBitField,
  ChannelType,
} from "discord.js";

export async function setupInfoTicket(client) {
  const INFO_TICKET_CATEGORY_ID = "1437823159796629514";

  client.on("messageCreate", async (msg) => {
    if (msg.author.bot) return;
    if (msg.content === "!문의티켓") {
      const embed = new EmbedBuilder()
        .setColor("#2a5034")
        .setTitle("<:ticket:1438075138078675015> 전격부대 문의 티켓")
        .setDescription(
          "전격부대에 문의할 사항이 있을 경우, 아래 카테고리를 문의내용에 맞게 선택하시고 티켓을 생성해주세요.\n" +
          "티켓 확인은 최대 **12시간 내** 처리됩니다."
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("info_operate").setLabel("운영문의").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("info_scout").setLabel("스카웃 문의").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("info_ally").setLabel("동맹 문의").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("info_report").setLabel("신고 문의").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("info_other").setLabel("기타 문의").setStyle(ButtonStyle.Primary)
      );

      await msg.channel.send({ embeds: [embed], components: [row] });
    }
  });

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    // 🔹 문의 티켓 생성
    if ([
      "info_operate",
      "info_scout",
      "info_ally",
      "info_report",
      "info_other",
    ].includes(interaction.customId)) {
      const uid = interaction.user.username;
      const rand4 = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
      let title, roleIDs;

      switch (interaction.customId) {
        case "info_operate":
          title = `운영문의-${interaction.user.id}-${rand4}`;
          roleIDs = ["1437803495683264682"];
          break;
        case "info_scout":
          title = `스카웃문의-${interaction.user.id}-${rand4}`;
          roleIDs = ["1437404632224895089","1437404630739980409","1437404629288751236"];
          break;
        case "info_ally":
          title = `동맹문의-${interaction.user.id}-${rand4}`;
          roleIDs = ["1437803495683264682"];
          break;
        case "info_report":
          title = `신고문의-${interaction.user.id}-${rand4}`;
          roleIDs = ["1437804256911425728"];
          break;
        case "info_other":
          title = `기타문의-${interaction.user.id}-${rand4}`;
          roleIDs = ["1437803495683264682"];
          break;
      }

      await interaction.reply({
        content: "📂 티켓 생성중… 잠시만 기다려주세요.",
        ephemeral: true,
      });

      const ticketChannel = await interaction.guild.channels.create({
        name: title,
        type: ChannelType.GuildText,
        parent: INFO_TICKET_CATEGORY_ID,
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
          ...roleIDs.map((rid) => ({
            id: rid,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.AttachFiles,
              PermissionsBitField.Flags.EmbedLinks,
            ],
          })),
        ],
      });

      await interaction.editReply({
        content: `✅ 티켓이 생성되었습니다: <#${ticketChannel.id}> 로 이동해 주세요.`,
      });

      const embed = new EmbedBuilder()
        .setColor("#2a5034")
        .setTitle(`📨 ${title}`)
        .setDescription("운영진이 확인할 때까지 잠시만 기다려주세요.")
        .addFields(
          { name: "문의자", value: `${interaction.user.tag}` },
          { name: "문의종류", value: title.split("-")[0] }
        );

      const rowClose = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("close_ticket")
          .setLabel("📩 티켓 닫기")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId("delete_ticket")
          .setLabel("🗑️ 티켓 삭제하기")
          .setStyle(ButtonStyle.Secondary)
      );

      await ticketChannel.send({
        content: `${interaction.user}`,
        embeds: [embed],
        components: [rowClose],
      });
      return;
    }

    // 🔹 티켓 닫기
    if (interaction.customId === "close_ticket") {
      const channel = interaction.channel;
      const guild = interaction.guild;
      const ticketOwnerId = channel.name.split("-")[1];

      const member = guild.members.cache.get(ticketOwnerId);
      if (member) {
        await channel.permissionOverwrites.edit(member.id, {
          ViewChannel: false,
          SendMessages: false,
        });
      }

      await interaction.update({
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("close_ticket_disabled")
              .setLabel("📩 티켓 닫힘")
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId("delete_ticket")
              .setLabel("🗑️ 티켓 삭제하기")
              .setStyle(ButtonStyle.Secondary)
          ),
        ],
      });

      await channel.send({
        content: `🔒 ${member ? member.displayName : "사용자"} 님이 티켓을 닫았습니다.\n필요시 🗑️ 삭제 버튼을 눌러주세요.`,
      });
      return;
    }

    // 🔹 티켓 삭제
    if (interaction.customId === "delete_ticket") {
      const channel = interaction.channel;
      await channel.delete().catch(() => null);
      return;
    }
  });
}
