const express = require("express");
const app = express();

app.get("/", (req, res) => {
    res.send("Bot is running!");
});

app.listen(process.env.PORT || 3000, () => {
    console.log("✅ Server ready on port 3000");
});
const {
    Client,
    GatewayIntentBits,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const activeGiveaways = new Map();
const completedGiveaways = new Map();
const activeTickets = new Map();
let ticketCounter = 1;

const ticketCategories = new Map();
const defaultCategories = [
    { name: "HELP!", emoji: "📩", style: "Danger", color: "#FF0000" },
    {
        name: "GIVEAWAY PAYOUT",
        emoji: "🎁",
        style: "Success",
        color: "#00FF00",
    },
    { name: "28$ HELP", emoji: "✅", style: "Primary", color: "#0099FF" },
];

client.once("ready", async () => {
    console.log(`✅ Bot is ready! Logged in as ${client.user.tag}`);

    await registerCommands();

    setInterval(() => {
        updateGiveawayTimers();
    }, 1000);
});

async function registerCommands() {
    const commands = [
        {
            name: "giveaway",
            description: "Create a new giveaway",
            options: [
                {
                    name: "prize",
                    description: "The prize for the giveaway",
                    type: 3,
                    required: true,
                },
                {
                    name: "winners",
                    description: "Number of winners",
                    type: 4,
                    required: true,
                },
                {
                    name: "duration",
                    description: "Duration (e.g., 1h, 30m, 2h30m)",
                    type: 3,
                    required: true,
                },
                {
                    name: "bonus_role_1",
                    description: "First bonus role (optional)",
                    type: 8,
                    required: false,
                },
                {
                    name: "bonus_entries_1",
                    description: "Extra entries for first bonus role",
                    type: 4,
                    required: false,
                },
                {
                    name: "bonus_role_2",
                    description: "Second bonus role (optional)",
                    type: 8,
                    required: false,
                },
                {
                    name: "bonus_entries_2",
                    description: "Extra entries for second bonus role",
                    type: 4,
                    required: false,
                },
                {
                    name: "bonus_role_3",
                    description: "Third bonus role (optional)",
                    type: 8,
                    required: false,
                },
                {
                    name: "bonus_entries_3",
                    description: "Extra entries for third bonus role",
                    type: 4,
                    required: false,
                },
                {
                    name: "bonus_role_4",
                    description: "Fourth bonus role (optional)",
                    type: 8,
                    required: false,
                },
                {
                    name: "bonus_entries_4",
                    description: "Extra entries for fourth bonus role",
                    type: 4,
                    required: false,
                },
                {
                    name: "bonus_role_5",
                    description: "Fifth bonus role (optional)",
                    type: 8,
                    required: false,
                },
                {
                    name: "bonus_entries_5",
                    description: "Extra entries for fifth bonus role",
                    type: 4,
                    required: false,
                },
                {
                    name: "recurring",
                    description: "Make this a recurring giveaway (optional)",
                    type: 3,
                    required: false,
                    choices: [
                        {
                            name: "Daily",
                            value: "daily",
                        },
                        {
                            name: "hours",
                            value: "hours",
                        },
                        {
                            name: "Monthly",
                            value: "monthly",
                        },
                    ],
                },
            ],
            default_member_permissions:
                PermissionFlagsBits.ManageGuild.toString(),
        },
        {
            name: "reroll",
            description: "Reroll winners for a completed giveaway",
            options: [
                {
                    name: "message_id",
                    description: "The message ID of the completed giveaway",
                    type: 3,
                    required: true,
                },
                {
                    name: "winners",
                    description: "Number of new winners to select (optional)",
                    type: 4,
                    required: false,
                },
            ],
            default_member_permissions:
                PermissionFlagsBits.ManageGuild.toString(),
        },
        {
            name: "ticket-setup",
            description: "Setup ticket system in this channel",
            default_member_permissions:
                PermissionFlagsBits.ManageGuild.toString(),
        },
        {
            name: "ticket-close",
            description: "Close the current ticket",
        },
        {
            name: "ticket-category",
            description: "Manage ticket categories",
            options: [
                {
                    name: "add",
                    description: "Add a new ticket category",
                    type: 1,
                    options: [
                        {
                            name: "name",
                            description: "Category name (e.g., Bug Report)",
                            type: 3,
                            required: true,
                        },
                        {
                            name: "emoji",
                            description: "Category emoji (e.g., 🐛)",
                            type: 3,
                            required: true,
                        },
                        {
                            name: "color",
                            description:
                                "Button style (Danger/Success/Primary/Secondary)",
                            type: 3,
                            required: false,
                            choices: [
                                { name: "Red (Danger)", value: "Danger" },
                                { name: "Green (Success)", value: "Success" },
                                { name: "Blue (Primary)", value: "Primary" },
                                {
                                    name: "Gray (Secondary)",
                                    value: "Secondary",
                                },
                            ],
                        },
                    ],
                },
                {
                    name: "remove",
                    description: "Remove a ticket category",
                    type: 1,
                    options: [
                        {
                            name: "name",
                            description: "Category name to remove",
                            type: 3,
                            required: true,
                        },
                    ],
                },
                {
                    name: "list",
                    description: "List all ticket categories",
                    type: 1,
                },
            ],
            default_member_permissions:
                PermissionFlagsBits.ManageGuild.toString(),
        },
        {
            name: "ticket-panel",
            description: "Create a new ticket panel with updated categories",
            default_member_permissions:
                PermissionFlagsBits.ManageGuild.toString(),
        },
    ];

    try {
        console.log("🔄 Registering slash commands...");
        await client.application.commands.set(commands);
        console.log("✅ Slash commands registered successfully!");
    } catch (error) {
        console.error("❌ Error registering commands:", error);
    }
}

client.on("interactionCreate", async (interaction) => {
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === "giveaway") {
            await handleGiveawayCommand(interaction);
        } else if (interaction.commandName === "reroll") {
            await handleRerollCommand(interaction);
        } else if (interaction.commandName === "ticket-setup") {
            await handleTicketSetup(interaction);
        } else if (interaction.commandName === "ticket-close") {
            await handleTicketClose(interaction);
        } else if (interaction.commandName === "ticket-category") {
            await handleTicketCategoryCommand(interaction);
        } else if (interaction.commandName === "ticket-panel") {
            await handleTicketPanel(interaction);
        }
    } else if (interaction.isButton()) {
        if (interaction.customId.startsWith("giveaway_enter_")) {
            await handleGiveawayEntry(interaction);
        } else if (interaction.customId.startsWith("giveaway_participants_")) {
            await handleViewParticipants(interaction);
        } else if (interaction.customId.startsWith("ticket_create_")) {
            const categoryName = interaction.customId
                .replace("ticket_create_", "")
                .replace(/_/g, " ");
            await handleTicketCreate(interaction, categoryName);
        } else if (interaction.customId === "ticket_close_btn") {
            await handleTicketCloseButton(interaction);
        } else if (interaction.customId === "vouch_done") {
            await handleVouchDone(interaction);
        } else if (interaction.customId === "vouch_not_received") {
            await handleVouchNotReceived(interaction);
        }
    }
});

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const content = message.content.trim();

    // .c command - Close ticket
    if (content === ".c") {
        const ticket = Array.from(activeTickets.values()).find(
            (t) => t.channelId === message.channel.id,
        );

        if (!ticket) {
            return message.reply("❌ This is not a ticket channel!");
        }

        try {
            const embed = new EmbedBuilder()
                .setColor("#FF0000")
                .setTitle("🔒 Ticket Closing")
                .setDescription(
                    `Ticket #${ticket.ticketNumber} is being closed by ${message.author}\n\n` +
                        `This channel will be deleted in 5 seconds.`,
                )
                .setTimestamp();

            await message.reply({ embeds: [embed] });

            setTimeout(async () => {
                try {
                    activeTickets.delete(ticket.userId);
                    await message.channel.delete();
                    console.log(
                        `✅ Ticket #${ticket.ticketNumber} closed by ${message.author.tag} using .c command`,
                    );
                } catch (err) {
                    console.error("Error deleting channel:", err);
                }
            }, 5000);
        } catch (error) {
            console.error("Error closing ticket:", error);
        }
    }

    // .add @user command - Add member to ticket
    if (content.startsWith(".add ")) {
        const ticket = Array.from(activeTickets.values()).find(
            (t) => t.channelId === message.channel.id,
        );

        if (!ticket) {
            return message.reply("❌ This is not a ticket channel!");
        }

        const mentionedUser = message.mentions.users.first();
        if (!mentionedUser) {
            return message.reply(
                "❌ Please mention a user to add! Example: `.add @username`",
            );
        }

        try {
            await message.channel.permissionOverwrites.create(
                mentionedUser.id,
                {
                    ViewChannel: true,
                    SendMessages: true,
                    ReadMessageHistory: true,
                    AttachFiles: true,
                    EmbedLinks: true,
                },
            );

            const embed = new EmbedBuilder()
                .setColor("#00FF00")
                .setTitle("✅ Member Added")
                .setDescription(
                    `${mentionedUser} has been added to this ticket by ${message.author}`,
                )
                .setTimestamp();

            await message.reply({ embeds: [embed] });
            console.log(
                `✅ ${mentionedUser.tag} added to ticket #${ticket.ticketNumber} by ${message.author.tag}`,
            );
        } catch (error) {
            console.error("Error adding user to ticket:", error);
            await message.reply(
                "❌ Failed to add user to ticket. Make sure I have proper permissions!",
            );
        }
    }

    // .rn <name> command - Rename ticket
    if (content.startsWith(".rn ")) {
        const ticket = Array.from(activeTickets.values()).find(
            (t) => t.channelId === message.channel.id,
        );

        if (!ticket) {
            return message.reply("❌ This is not a ticket channel!");
        }

        const newName = content
            .substring(4)
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "-");

        if (!newName || newName.length < 2) {
            return message.reply(
                "❌ Please provide a valid name! Example: `.rn payment-issue`",
            );
        }

        try {
            await message.channel.setName(newName);

            const embed = new EmbedBuilder()
                .setColor("#5865F2")
                .setTitle("✏️ Ticket Renamed")
                .setDescription(
                    `Ticket has been renamed to **${newName}** by ${message.author}\n` +
                        `Ticket #${ticket.ticketNumber}`,
                )
                .setTimestamp();

            await message.reply({ embeds: [embed] });
            console.log(
                `✅ Ticket #${ticket.ticketNumber} renamed to ${newName} by ${message.author.tag}`,
            );
        } catch (error) {
            console.error("Error renaming ticket:", error);
            await message.reply(
                "❌ Failed to rename ticket. Make sure I have **Manage Channels** permission!",
            );
        }
    }

    // .v command - Giveaway prize vouch with amount
    if (content.startsWith(".v")) {
        const ticket = Array.from(activeTickets.values()).find(
            (t) => t.channelId === message.channel.id,
        );

        if (!ticket) {
            return message.reply("❌ This is not a ticket channel!");
        }
        // Extract amount from command (e.g., .v 5$, .v 2$)
        const amountMatch = content.match(/\.v\s*(\d+\$?)/);
        const amount = amountMatch
            ? amountMatch[1].replace("$", "") + "$"
            : null;

        if (!amount) {
            return message.reply(
                "❌ Please specify an amount! Example: `.v 5$` or `.v 2$`",
            );
        }

        try {
            const ticketUser = await client.users.fetch(ticket.userId);
            const vouchText = `Legit Got ${amount} from {message.author}!`;

            const embed = new EmbedBuilder()
                .setColor("#00FF00")
                .setTitle("🎁 Giveaway Prize Sent")
                .setDescription(
                    `${ticketUser}, the giveaway prize of **${amount}** has been sent!\n\n` +
                        `**Copy and paste this to vouch:**\n` +
                        `\`\`\`\n${vouchText}\n\`\`\`\n` +
                        `Please confirm if you received it by clicking one of the buttons below.`,
                )
                .setFooter({ text: `Ticket #${ticket.ticketNumber}` })
                .setTimestamp();
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("vouch_done")
                    .setLabel("Done")
                    .setEmoji("✅")
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId("vouch_not_received")
                    .setLabel("Not Received")
                    .setEmoji("❌")
                    .setStyle(ButtonStyle.Danger),
            );

            await message.channel.send({
                content: `${ticketUser}`,
                embeds: [embed],
                components: [row],
            });

            console.log(
                `✅ Vouch message sent in ticket #${ticket.ticketNumber} by ${message.author.tag} - Amount: ${amount}`,
            );
        } catch (error) {
            console.error("Error sending vouch message:", error);
            await message.reply("❌ Failed to send vouch message!");
        }
    }
});

function hasRole(member, roleId) {
    if (Array.isArray(member.roles)) {
        return member.roles.includes(roleId);
    }
    return member.roles.cache.has(roleId);
}

function parseDuration(durationStr) {
    const hourMatch = durationStr.match(/(\d+)\s*h/i);
    const minuteMatch = durationStr.match(/(\d+)\s*m/i);

    let hours = 0;
    let minutes = 0;

    if (hourMatch) {
        hours = parseInt(hourMatch[1]);
    }

    if (minuteMatch) {
        minutes = parseInt(minuteMatch[1]);
    }

    if (hours === 0 && minutes === 0) {
        const numOnly = parseInt(durationStr);
        if (!isNaN(numOnly)) {
            hours = numOnly;
        }
    }

    return (hours * 60 + minutes) * 60 * 1000;
}

async function handleGiveawayCommand(interaction) {
    await interaction.deferReply();

    const prize = interaction.options.getString("prize");
    const winners = interaction.options.getInteger("winners");
    const durationStr = interaction.options.getString("duration");
    const requiredRole = interaction.options.getRole("required_role");
    const recurring = interaction.options.getString("recurring");

    const durationMs = parseDuration(durationStr);

    if (durationMs === 0) {
        return interaction.editReply({
            content:
                "❌ Invalid duration format! Use: 1h, 30m, 2h30m, or just a number for hours.",
        });
    }

    const bonusRoles = [];
    for (let i = 1; i <= 5; i++) {
        const role = interaction.options.getRole(`bonus_role_${i}`);
        const entries = interaction.options.getInteger(`bonus_entries_${i}`);
        if (role && entries) {
            bonusRoles.push({ role, entries });
        }
    }

    const endTime = Date.now() + durationMs;
    const uniqueId = Date.now().toString();
    const enterButtonId = `giveaway_enter_${uniqueId}`;
    const participantsButtonId = `giveaway_participants_${uniqueId}`;

    const botAvatarURL = client.user.displayAvatarURL({
        dynamic: true,
        size: 256,
    });

    const embed = new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle(`🎉 ${prize}`)
        .setDescription(
            createGiveawayDescription(
                winners,
                interaction.user,
                endTime,
                bonusRoles,
                requiredRole,
                recurring,
            ),
        )
        .setThumbnail(botAvatarURL)
        .setFooter({ text: `Ends at | ${new Date(endTime).toLocaleString()}` })
        .setTimestamp(endTime);

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(enterButtonId)
            .setLabel("0")
            .setEmoji("🎉")
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId(participantsButtonId)
            .setLabel("Participants")
            .setEmoji("👥")
            .setStyle(ButtonStyle.Secondary),
    );

    await interaction.deleteReply();
    const message = await interaction.channel.send({
        embeds: [embed],
        components: [row],
    });

    const giveawayId = message.id;
    activeGiveaways.set(giveawayId, {
        messageId: giveawayId,
        channelId: interaction.channel.id,
        prize,
        winners,
        duration: durationMs / (60 * 60 * 1000),
        endTime,
        host: interaction.user.id,
        participants: new Map(),
        requiredRole: requiredRole?.id,
        bonusRoles: bonusRoles.map((br) => ({
            roleId: br.role.id,
            entries: br.entries,
            name: br.role.name,
        })),
        buttonId: enterButtonId,
        participantsButtonId: participantsButtonId,
        recurring: recurring || null,
    });

    console.log(
        `✅ Giveaway created: ${prize} (Duration: ${durationStr}) (ID: ${giveawayId})${recurring ? ` [${recurring.toUpperCase()}]` : ""}`,
    );
}

function createGiveawayDescription(
    winners,
    host,
    endTime,
    bonusRoles,
    requiredRole,
    recurring,
) {
    let description = `Click 🎉 button to enter!\n`;
    description += `**Winners:** ${winners}\n`;
    description += `**Hosted by:** ${host}\n`;
    description += `**Ends:** in ${getTimeRemaining(endTime)} **(Timer)**\n`;

    if (recurring) {
        const recurringText = {
            daily: "🔄 Daily",
            weekly: "🔄 Weekly",
            monthly: "🔄 Monthly",
        };
        description += `**Recurring:** ${recurringText[recurring]}\n`;
    }

    if (bonusRoles.length > 0) {
        description += `\n**Extra Entries:**\n`;
        bonusRoles.forEach((br) => {
            description += `${br.role}: **+${br.entries} ${br.entries === 1 ? "entry" : "entries"}**\n`;
        });
    }

    if (requiredRole) {
        description += `\n**Must have the role:** ${requiredRole}`;
    }

    return description;
}

function getTimeRemaining(endTime) {
    const now = Date.now();
    const diff = endTime - now;

    if (diff <= 0) return "0 seconds";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    let timeStr = "";
    if (days > 0) timeStr += `${days} day${days !== 1 ? "s" : ""} `;
    if (hours > 0) timeStr += `${hours} hour${hours !== 1 ? "s" : ""} `;
    if (minutes > 0) timeStr += `${minutes} minute${minutes !== 1 ? "s" : ""} `;
    if (seconds > 0 && days === 0)
        timeStr += `${seconds} second${seconds !== 1 ? "s" : ""}`;

    return timeStr.trim();
}

async function handleGiveawayEntry(interaction) {
    const giveaway = Array.from(activeGiveaways.values()).find((g) =>
        interaction.customId.includes(g.buttonId.split("_").pop()),
    );

    if (!giveaway) {
        return interaction.reply({
            content: "❌ This giveaway no longer exists!",
            ephemeral: true,
        });
    }

    if (Date.now() >= giveaway.endTime) {
        return interaction.reply({
            content: "❌ This giveaway has already ended!",
            ephemeral: true,
        });
    }

    const member = interaction.member;

    if (giveaway.requiredRole && !hasRole(member, giveaway.requiredRole)) {
        const role = await interaction.guild.roles.fetch(giveaway.requiredRole);
        return interaction.reply({
            content: `❌ You need the **${role.name}** role to enter this giveaway!`,
            ephemeral: true,
        });
    }

    let entries = 1;
    let bonusInfo = [];

    for (const bonus of giveaway.bonusRoles) {
        if (hasRole(member, bonus.roleId)) {
            entries += bonus.entries;
            bonusInfo.push(`+${bonus.entries} from ${bonus.name}`);
        }
    }

    giveaway.participants.set(interaction.user.id, {
        userId: interaction.user.id,
        username: interaction.user.username,
        entries: entries,
    });

    await updateGiveawayMessage(giveaway);

    let replyMsg = `✅ You've entered the giveaway with **${entries} ${entries === 1 ? "entry" : "entries"}**!`;
    if (bonusInfo.length > 0) {
        replyMsg += `\n\n**Bonus entries:**\n${bonusInfo.join("\n")}`;
    }

    await interaction.reply({ content: replyMsg, ephemeral: true });
}

async function handleViewParticipants(interaction) {
    const giveaway = Array.from(activeGiveaways.values()).find((g) =>
        interaction.customId.includes(g.participantsButtonId.split("_").pop()),
    );

    if (!giveaway) {
        return interaction.reply({
            content: "❌ This giveaway no longer exists!",
            ephemeral: true,
        });
    }

    const participants = Array.from(giveaway.participants.values());

    if (participants.length === 0) {
        return interaction.reply({
            content: "❌ No one has entered this giveaway yet!",
            ephemeral: true,
        });
    }

    const embed = new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle(`👥 Giveaway Participants (${participants.length})`)
        .setDescription(
            participants
                .slice(0, 25)
                .map(
                    (p, i) =>
                        `${i + 1}. **${p.username}** - ${p.entries} ${p.entries === 1 ? "entry" : "entries"}`,
                )
                .join("\n") +
                (participants.length > 25
                    ? `\n\n...and ${participants.length - 25} more!`
                    : ""),
        );

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function updateGiveawayMessage(giveaway) {
    try {
        const channel = await client.channels.fetch(giveaway.channelId);
        const message = await channel.messages.fetch(giveaway.messageId);

        const totalParticipants = giveaway.participants.size;

        const embed = EmbedBuilder.from(message.embeds[0]);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(giveaway.buttonId)
                .setLabel(totalParticipants.toString())
                .setEmoji("🎉")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(giveaway.participantsButtonId)
                .setLabel("Participants")
                .setEmoji("👥")
                .setStyle(ButtonStyle.Secondary),
        );

        await message.edit({ embeds: [embed], components: [row] });
    } catch (error) {
        console.error("Error updating giveaway message:", error);
    }
}

async function updateGiveawayTimers() {
    for (const [giveawayId, giveaway] of activeGiveaways) {
        try {
            const channel = await client.channels.fetch(giveaway.channelId);
            const message = await channel.messages.fetch(giveaway.messageId);

            if (Date.now() >= giveaway.endTime) {
                await endGiveaway(giveaway);
                activeGiveaways.delete(giveawayId);
            } else {
                const host = await client.users.fetch(giveaway.host);
                const newDescription = createGiveawayDescription(
                    giveaway.winners,
                    host,
                    giveaway.endTime,
                    giveaway.bonusRoles.map((br) => ({
                        role: `<@&${br.roleId}>`,
                        entries: br.entries,
                    })),
                    giveaway.requiredRole
                        ? `<@&${giveaway.requiredRole}>`
                        : null,
                    giveaway.recurring,
                );

                const embed = EmbedBuilder.from(
                    message.embeds[0],
                ).setDescription(newDescription);

                await message.edit({ embeds: [embed] });
            }
        } catch (error) {
            console.error(`Error updating giveaway ${giveawayId}:`, error);
        }
    }
}

async function endGiveaway(giveaway) {
    try {
        const channel = await client.channels.fetch(giveaway.channelId);
        const message = await channel.messages.fetch(giveaway.messageId);
        const botAvatarURL = client.user.displayAvatarURL({
            dynamic: true,
            size: 256,
        });

        const participants = Array.from(giveaway.participants.values());

        if (participants.length === 0) {
            const embed = new EmbedBuilder()
                .setColor("#FF0000")
                .setTitle(`🎉 ${giveaway.prize}`)
                .setDescription("❌ No valid entries. Giveaway cancelled.")
                .setThumbnail(botAvatarURL)
                .setFooter({ text: "Ended" })
                .setTimestamp();

            await message.edit({ embeds: [embed], components: [] });
            await channel.send(
                `❌ The giveaway for **${giveaway.prize}** had no participants!`,
            );

            if (giveaway.recurring) {
                await createRecurringGiveaway(giveaway, channel);
            }
            return;
        }

        const allEntries = [];
        participants.forEach((p) => {
            for (let i = 0; i < p.entries; i++) {
                allEntries.push(p.userId);
            }
        });

        const winners = [];
        const winnerIds = new Set();

        for (
            let i = 0;
            i < Math.min(giveaway.winners, participants.length);
            i++
        ) {
            let attempts = 0;
            while (attempts < 100) {
                const randomIndex = Math.floor(
                    Math.random() * allEntries.length,
                );
                const winnerId = allEntries[randomIndex];

                if (!winnerIds.has(winnerId)) {
                    winnerIds.add(winnerId);
                    const participant = participants.find(
                        (p) => p.userId === winnerId,
                    );
                    winners.push(participant);
                    break;
                }
                attempts++;
            }
        }

        const embed = new EmbedBuilder()
            .setColor("#00FF00")
            .setTitle(`🎉 ${giveaway.prize}`)
            .setDescription(
                `**Winners:**\n${winners.map((w) => `<@${w.userId}>`).join("\n")}\n\n` +
                    `**Hosted by:** <@${giveaway.host}>`,
            )
            .setThumbnail(botAvatarURL)
            .setFooter({ text: "Ended" })
            .setTimestamp();

        await message.edit({ embeds: [embed], components: [] });

        const winnerMentions = winners.map((w) => `<@${w.userId}>`).join(", ");
        await channel.send(
            `🎊 Congratulations ${winnerMentions}! You won **${giveaway.prize}**!`,
        );

        completedGiveaways.set(giveaway.messageId, {
            ...giveaway,
            winners: winners.map((w) => w.userId),
        });

        if (giveaway.recurring) {
            await createRecurringGiveaway(giveaway, channel);
        }
    } catch (error) {
        console.error("Error ending giveaway:", error);
    }
}

async function createRecurringGiveaway(oldGiveaway, channel) {
    try {
        const recurringIntervals = {
            daily: 24,
            weekly: 24 * 7,
            monthly: 24 * 30,
        };

        const durationHours =
            recurringIntervals[oldGiveaway.recurring] || oldGiveaway.duration;
        const endTime = Date.now() + durationHours * 60 * 60 * 1000;
        const uniqueId = Date.now().toString();
        const enterButtonId = `giveaway_enter_${uniqueId}`;
        const participantsButtonId = `giveaway_participants_${uniqueId}`;

        const host = await client.users.fetch(oldGiveaway.host);
        const botAvatarURL = client.user.displayAvatarURL({
            dynamic: true,
            size: 256,
        });

        const bonusRolesFormatted = oldGiveaway.bonusRoles.map((br) => ({
            role: `<@&${br.roleId}>`,
            entries: br.entries,
        }));

        const embed = new EmbedBuilder()
            .setColor("#5865F2")
            .setTitle(`🎉 ${oldGiveaway.prize}`)
            .setDescription(
                createGiveawayDescription(
                    oldGiveaway.winners,
                    host,
                    endTime,
                    bonusRolesFormatted,
                    oldGiveaway.requiredRole
                        ? `<@&${oldGiveaway.requiredRole}>`
                        : null,
                    oldGiveaway.recurring,
                ),
            )
            .setThumbnail(botAvatarURL)
            .setFooter({
                text: `Ends at | ${new Date(endTime).toLocaleString()}`,
            })
            .setTimestamp(endTime);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(enterButtonId)
                .setLabel("0")
                .setEmoji("🎉")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(participantsButtonId)
                .setLabel("Participants")
                .setEmoji("👥")
                .setStyle(ButtonStyle.Secondary),
        );

        const message = await channel.send({
            embeds: [embed],
            components: [row],
        });

        const giveawayId = message.id;
        activeGiveaways.set(giveawayId, {
            messageId: giveawayId,
            channelId: channel.id,
            prize: oldGiveaway.prize,
            winners: oldGiveaway.winners,
            duration: durationHours,
            endTime,
            host: oldGiveaway.host,
            participants: new Map(),
            requiredRole: oldGiveaway.requiredRole,
            bonusRoles: oldGiveaway.bonusRoles,
            buttonId: enterButtonId,
            participantsButtonId: participantsButtonId,
            recurring: oldGiveaway.recurring,
        });

        console.log(
            `🔄 Recurring giveaway created: ${oldGiveaway.prize} (ID: ${giveawayId}) [${oldGiveaway.recurring.toUpperCase()}]`,
        );
    } catch (error) {
        console.error("Error creating recurring giveaway:", error);
    }
}

async function handleRerollCommand(interaction) {
    await interaction.deferReply();

    const messageId = interaction.options.getString("message_id");
    const newWinnerCount = interaction.options.getInteger("winners");

    const giveaway = completedGiveaways.get(messageId);

    if (!giveaway) {
        return interaction.editReply({
            content:
                "❌ Could not find a completed giveaway with that message ID!",
        });
    }

    try {
        const channel = await client.channels.fetch(giveaway.channelId);
        const message = await channel.messages.fetch(giveaway.messageId);

        const participants = Array.from(giveaway.participants.values());
        const previousWinners = new Set(giveaway.winners);

        const availableParticipants = participants.filter(
            (p) => !previousWinners.has(p.userId),
        );

        if (availableParticipants.length === 0) {
            return interaction.editReply({
                content: "❌ No more participants available to reroll!",
            });
        }

        const allEntries = [];
        availableParticipants.forEach((p) => {
            for (let i = 0; i < p.entries; i++) {
                allEntries.push(p.userId);
            }
        });

        const winnersToSelect = newWinnerCount || 1;
        const newWinners = [];
        const newWinnerIds = new Set();

        for (
            let i = 0;
            i < Math.min(winnersToSelect, availableParticipants.length);
            i++
        ) {
            let attempts = 0;
            while (attempts < 100) {
                const randomIndex = Math.floor(
                    Math.random() * allEntries.length,
                );
                const winnerId = allEntries[randomIndex];

                if (!newWinnerIds.has(winnerId)) {
                    newWinnerIds.add(winnerId);
                    const participant = participants.find(
                        (p) => p.userId === winnerId,
                    );
                    newWinners.push(participant);
                    break;
                }
                attempts++;
            }
        }

        const allWinnerIds = [...previousWinners, ...newWinnerIds];
        const allWinnersList = allWinnerIds.map((id) => `<@${id}>`);
        const botAvatarURL = client.user.displayAvatarURL({
            dynamic: true,
            size: 256,
        });

        const embed = new EmbedBuilder()
            .setColor("#00FF00")
            .setTitle(`🎉 ${giveaway.prize}`)
            .setDescription(
                `**Winners:**\n${allWinnersList.join("\n")}\n\n` +
                    `**Hosted by:** <@${giveaway.host}>\n\n` +
                    `**🔄 Rerolled by:** ${interaction.user}`,
            )
            .setThumbnail(botAvatarURL)
            .setFooter({ text: "Ended (Rerolled)" })
            .setTimestamp();

        await message.edit({ embeds: [embed] });

        const newWinnerMentions = newWinners
            .map((w) => `<@${w.userId}>`)
            .join(", ");
        await channel.send(
            `🔄 **Reroll!** Congratulations ${newWinnerMentions}! You won **${giveaway.prize}**!`,
        );

        giveaway.winners = allWinnerIds;
        completedGiveaways.set(messageId, giveaway);

        await interaction.editReply({
            content: `✅ Successfully rerolled ${newWinners.length} new ${newWinners.length === 1 ? "winner" : "winners"}!`,
        });
    } catch (error) {
        console.error("Error rerolling giveaway:", error);
        await interaction.editReply({
            content:
                "❌ Error rerolling giveaway. Make sure the message ID is correct and the giveaway has ended.",
        });
    }
}

async function handleTicketSetup(interaction) {
    defaultCategories.forEach((cat) => {
        if (!ticketCategories.has(cat.name)) {
            ticketCategories.set(cat.name, cat);
        }
    });

    const categories = Array.from(ticketCategories.values());

    let description = "Click a button below to create a support ticket:\n\n";
    categories.forEach((cat) => {
        description += `${cat.emoji} **${cat.name}**\n`;
    });
    description += "\n🎫 *Professional ticket system for your server*";

    const embed = new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle("🎫 SUPPORT TICKET SYSTEM")
        .setDescription(description)
        .setFooter({ text: "Click the appropriate button for your issue" });

    const rows = [];
    let currentRow = new ActionRowBuilder();

    categories.forEach((cat, index) => {
        const customId = `ticket_create_${cat.name.replace(/\s+/g, "_")}`;

        currentRow.addComponents(
            new ButtonBuilder()
                .setCustomId(customId)
                .setLabel(cat.name)
                .setEmoji(cat.emoji)
                .setStyle(ButtonStyle[cat.style]),
        );

        if ((index + 1) % 5 === 0 || index === categories.length - 1) {
            rows.push(currentRow);
            currentRow = new ActionRowBuilder();
        }
    });

    await interaction.reply({
        content: "✅ Ticket system has been set up!",
        ephemeral: true,
    });

    await interaction.channel.send({
        embeds: [embed],
        components: rows,
    });

    console.log(
        `✅ Ticket system setup in channel: ${interaction.channel.name}`,
    );
}

async function handleTicketPanel(interaction) {
    const categories = Array.from(ticketCategories.values());

    if (categories.length === 0) {
        return interaction.reply({
            content:
                "❌ No ticket categories found! Use `/ticket-category add` to create categories first.",
            ephemeral: true,
        });
    }

    let description = "Click a button below to create a support ticket:\n\n";
    categories.forEach((cat) => {
        description += `${cat.emoji} **${cat.name}**\n`;
    });
    description += "\n🎫 *Professional ticket system for your server*";

    const embed = new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle("🎫 SUPPORT TICKET SYSTEM")
        .setDescription(description)
        .setFooter({ text: "Click the appropriate button for your issue" });

    const rows = [];
    let currentRow = new ActionRowBuilder();

    categories.forEach((cat, index) => {
        const customId = `ticket_create_${cat.name.replace(/\s+/g, "_")}`;

        currentRow.addComponents(
            new ButtonBuilder()
                .setCustomId(customId)
                .setLabel(cat.name)
                .setEmoji(cat.emoji)
                .setStyle(ButtonStyle[cat.style]),
        );

        if ((index + 1) % 5 === 0 || index === categories.length - 1) {
            rows.push(currentRow);
            currentRow = new ActionRowBuilder();
        }
    });

    await interaction.reply({
        content: "✅ Updated ticket panel created!",
        ephemeral: true,
    });

    await interaction.channel.send({
        embeds: [embed],
        components: rows,
    });

    console.log(
        `✅ Ticket panel created in channel: ${interaction.channel.name}`,
    );
}

async function handleTicketCategoryCommand(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "add") {
        const name = interaction.options.getString("name");
        const emoji = interaction.options.getString("emoji");
        const style = interaction.options.getString("color") || "Primary";

        if (ticketCategories.has(name)) {
            return interaction.reply({
                content: `❌ Category **${name}** already exists!`,
                ephemeral: true,
            });
        }

        ticketCategories.set(name, { name, emoji, style });

        await interaction.reply({
            content: `✅ Category **${emoji} ${name}** has been added!\n\nUse \`/ticket-panel\` to create a new ticket panel with this category.`,
            ephemeral: true,
        });

        console.log(`✅ Ticket category added: ${name}`);
    } else if (subcommand === "remove") {
        const name = interaction.options.getString("name");

        if (!ticketCategories.has(name)) {
            return interaction.reply({
                content: `❌ Category **${name}** not found!`,
                ephemeral: true,
            });
        }

        ticketCategories.delete(name);

        await interaction.reply({
            content: `✅ Category **${name}** has been removed!\n\nUse \`/ticket-panel\` to update the ticket panel.`,
            ephemeral: true,
        });

        console.log(`✅ Ticket category removed: ${name}`);
    } else if (subcommand === "list") {
        const categories = Array.from(ticketCategories.values());

        if (categories.length === 0) {
            return interaction.reply({
                content:
                    "❌ No ticket categories found! Use `/ticket-category add` to create one.",
                ephemeral: true,
            });
        }

        const embed = new EmbedBuilder()
            .setColor("#5865F2")
            .setTitle("📋 Ticket Categories")
            .setDescription(
                categories
                    .map(
                        (cat, i) =>
                            `${i + 1}. ${cat.emoji} **${cat.name}** - Style: ${cat.style}`,
                    )
                    .join("\n"),
            )
            .setFooter({ text: `Total Categories: ${categories.length}` });

        await interaction.reply({
            embeds: [embed],
            ephemeral: true,
        });
    }
}

async function handleTicketCreate(interaction, ticketType) {
    const guild = interaction.guild;
    const member = interaction.member;

    const existingTicket = activeTickets.get(interaction.user.id);
    if (existingTicket) {
        return interaction.reply({
            content: `❌ You already have an open ticket: <#${existingTicket.channelId}>`,
            ephemeral: true,
        });
    }

    try {
        await interaction.reply({
            content: "🎫 Creating your ticket...",
            ephemeral: true,
        });

        const ticketNumber = ticketCounter++;
        const username = interaction.user.username
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");
        const channelName = `${username}-${ticketNumber}`;

        const categoryInfo = ticketCategories.get(ticketType);
        const categoryEmoji = categoryInfo ? categoryInfo.emoji : "🎫";

        // Find or create category for this ticket type
        let discordCategory = guild.channels.cache.find(
            (c) =>
                c.type === 4 &&
                c.name.toLowerCase() === ticketType.toLowerCase(),
        );

        if (!discordCategory) {
            try {
                discordCategory = await guild.channels.create({
                    name: ticketType,
                    type: 4,
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: ["ViewChannel"],
                        },
                        {
                            id: client.user.id,
                            allow: [
                                "ViewChannel",
                                "SendMessages",
                                "ManageChannels",
                                "ManageMessages",
                            ],
                        },
                    ],
                });
                console.log(`✅ Created category: ${ticketType}`);
            } catch (err) {
                console.error("Error creating category:", err);
            }
        }

        const ticketChannel = await guild.channels.create({
            name: channelName,
            type: 0,
            parent: discordCategory ? discordCategory.id : null,
            topic: `${ticketType} - ${interaction.user.tag}`,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: ["ViewChannel"],
                },
                {
                    id: interaction.user.id,
                    allow: [
                        "ViewChannel",
                        "SendMessages",
                        "ReadMessageHistory",
                        "AttachFiles",
                        "EmbedLinks",
                    ],
                },
                {
                    id: client.user.id,
                    allow: [
                        "ViewChannel",
                        "SendMessages",
                        "ManageChannels",
                        "ManageMessages",
                    ],
                },
            ],
        });

        const embed = new EmbedBuilder()
            .setColor("#5865F2")
            .setTitle(`${categoryEmoji} ${ticketType}`)
            .setDescription(
                `Welcome ${member}!\n\n` +
                    `**Ticket Type:** ${ticketType}\n` +
                    `**Created by:** ${interaction.user} (${interaction.user.tag})\n` +
                    `**Ticket Number:** #${ticketNumber}\n` +
                    `**Channel:** ${ticketChannel}\n\n` +
                    `📌 Support staff will be with you shortly.\n` +
                    `Please describe your issue in detail.`,
            )
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: `Ticket #${ticketNumber} | Created` })
            .setTimestamp();

        const closeButton = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("ticket_close_btn")
                .setLabel("Close Ticket")
                .setEmoji("🔒")
                .setStyle(ButtonStyle.Danger),
        );

        await ticketChannel.send({
            content: `${member} - Your **${ticketType}** ticket has been created!`,
            embeds: [embed],
            components: [closeButton],
        });

        activeTickets.set(interaction.user.id, {
            channelId: ticketChannel.id,
            ticketNumber,
            userId: interaction.user.id,
            username: interaction.user.tag,
            type: ticketType,
            createdAt: Date.now(),
        });

        await interaction.editReply({
            content: `✅ Ticket created successfully! Check ${ticketChannel}`,
        });

        console.log(
            `✅ Ticket #${ticketNumber} created for ${interaction.user.tag} - Category: ${ticketType} - Channel: ${channelName}`,
        );
    } catch (error) {
        console.error("Error creating ticket:", error);
        await interaction
            .editReply({
                content:
                    "❌ Error creating ticket. Please make sure the bot has **Manage Channels** permission!",
            })
            .catch(() => {});
    }
}

async function handleTicketClose(interaction) {
    const channel = interaction.channel;

    const ticket = Array.from(activeTickets.values()).find(
        (t) => t.channelId === channel.id,
    );

    if (!ticket) {
        return interaction.reply({
            content: "❌ This is not a ticket channel!",
            ephemeral: true,
        });
    }

    try {
        await interaction.reply({
            content: `🔒 Ticket #${ticket.ticketNumber} is closing in 5 seconds...`,
        });

        setTimeout(async () => {
            try {
                activeTickets.delete(ticket.userId);
                await channel.delete();
                console.log(
                    `✅ Ticket #${ticket.ticketNumber} closed by ${interaction.user.tag}`,
                );
            } catch (err) {
                console.error("Error deleting channel:", err);
            }
        }, 5000);
    } catch (error) {
        console.error("Error closing ticket:", error);
    }
}

async function handleTicketCloseButton(interaction) {
    const channel = interaction.channel;

    const ticket = Array.from(activeTickets.values()).find(
        (t) => t.channelId === channel.id,
    );

    if (!ticket) {
        return interaction.reply({
            content: "❌ This is not a ticket channel!",
            ephemeral: true,
        });
    }

    try {
        const embed = new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle("🔒 Ticket Closing")
            .setDescription(
                `Ticket #${ticket.ticketNumber} is being closed by ${interaction.user}\n\n` +
                    `This channel will be deleted in 5 seconds.`,
            )
            .setTimestamp();

        await interaction.reply({
            embeds: [embed],
        });

        setTimeout(async () => {
            try {
                activeTickets.delete(ticket.userId);
                await channel.delete();
                console.log(
                    `✅ Ticket #${ticket.ticketNumber} closed by ${interaction.user.tag}`,
                );
            } catch (err) {
                console.error("Error deleting channel:", err);
            }
        }, 5000);
    } catch (error) {
        console.error("Error closing ticket:", error);
    }
}

async function handleVouchDone(interaction) {
    const channel = interaction.channel;

    const ticket = Array.from(activeTickets.values()).find(
        (t) => t.channelId === channel.id,
    );

    if (!ticket) {
        return interaction.reply({
            content: "❌ This is not a ticket channel!",
            ephemeral: true,
        });
    }

    try {
        const confirmEmbed = new EmbedBuilder()
            .setColor("#00FF00")
            .setTitle("✅ Prize Received Confirmed")
            .setDescription(
                `${interaction.user} confirmed receiving the giveaway prize!\n\n` +
                    `Ticket #${ticket.ticketNumber} will be closed in 5 seconds.`,
            )
            .setTimestamp();

        await interaction.update({
            embeds: [confirmEmbed],
            components: [],
        });

        setTimeout(async () => {
            try {
                activeTickets.delete(ticket.userId);
                await channel.delete();
                console.log(
                    `✅ Ticket #${ticket.ticketNumber} closed after vouch confirmation by ${interaction.user.tag}`,
                );
            } catch (err) {
                console.error("Error deleting channel:", err);
            }
        }, 5000);
    } catch (error) {
        console.error("Error handling vouch done:", error);
    }
}

async function handleVouchNotReceived(interaction) {
    try {
        const embed = new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle("❌ Prize Not Received")
            .setDescription(
                `${interaction.user} reported not receiving the prize.\n\n` +
                    `Support staff has been notified. Please wait for assistance.`,
            )
            .setTimestamp();

        await interaction.update({
            embeds: [embed],
            components: [],
        });

        console.log(
            `⚠️ User ${interaction.user.tag} reported not receiving prize in ticket`,
        );
    } catch (error) {
        console.error("Error handling vouch not received:", error);
    }
}

const token = process.env.DISCORD_BOT_TOKEN;

if (!token) {
    console.error(
        "❌ Error: DISCORD_BOT_TOKEN is not set in environment variables!",
    );
    console.log("\n📝 To set up your bot:");
    console.log("1. Go to https://discord.com/developers/applications");
    console.log("2. Create a new application or select an existing one");
    console.log('3. Go to the "Bot" section and copy your bot token');
    console.log("4. Add the DISCORD_BOT_TOKEN secret in Replit");
    console.log("5. Invite the bot to your server with these permissions:");
    console.log("   - Send Messages");
    console.log("   - Embed Links");
    console.log("   - Use Slash Commands");
    console.log("   - Manage Roles (to check role membership)");
    process.exit(1);
} else {
    client.login(token).catch((err) => {
        console.error("❌ Failed to login:", err.message);

        if (err.message.includes("disallowed intents")) {
            console.log(
                '\n⚠️  IMPORTANT: You need to enable "Server Members Intent"!',
            );
            console.log("1. Go to https://discord.com/developers/applications");
            console.log("2. Select your application");
            console.log('3. Go to the "Bot" section');
            console.log('4. Scroll down to "Privileged Gateway Intents"');
            console.log('5. Enable "SERVER MEMBERS INTENT"');
            console.log("6. Save changes and restart the bot\n");
        }

        process.exit(1);
    });
}
