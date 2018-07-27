/**
 * Telegram Bot for Hyperbridge Organization
 * Website: https://hyperbridge.org/
 * 
 * Modified from Fabio Crispino aka Finalgalaxy
 * 
 * Features: 
 * - Ban users (Admin Only)
 * - Auto-Delete specified phrases
 * - Auto-Delete messages with multiple Telegram Usernames
 * - Saves all messages to messages.json
 */


const Telegraf = require('telegraf');   // Module to use Telegraf API.
const {Extra, Markup} = Telegraf;   // Extract Extra, Markups from Telegraf module.
const config = require('./config'); // Configuration file that holds telegraf_token API key.
const axios = require("axios");
const fs = require("fs");
const moment = require("moment");

const admin = "ashtqz";

var usernameToIDTable = {fr0stbyte2: 420734418, JPCullen: 489252909};         //Dictionary for mapping usernames to ID
var messagesToDelete = [/Join my/gi, /Partner Channel/gi];
var telegramRegex = /@[a-zA-Z0-9_]*/gi;
var messageReason = {
    "Join my": "Potential spam",
    "Partner Channel": "Potential spam"
};
var messagesForStorage;

const bot = new Telegraf(config.telegraf_token);    // Let's instantiate a bot using our token.

// We can get bot nickname from bot informations. This is particularly useful for groups.
bot.telegram.getMe().then((bot_informations) => {
    bot.options.username = bot_informations.username;
    console.log("Server has initialized bot nickname. Nick: "+bot_informations.username);
});

//Save usernames and ID's for new members
bot.on('new_chat_members', (ctx) => {
    //console.log(ctx.message.new_chat_members);
    var newUsername = ctx.message.new_chat_members[0].username;
    var newUserID = ctx.message.new_chat_members[0].id;
    usernameToIDTable[newUsername] = newUserID;
    //console.log(usernameToIDTable);
});

// Admin can ban by username
// Delete message & saveID if non-Admin uses !ban
// Format: !ban @exampleUsername
bot.hears(/!ban/i, (ctx) => {
    console.log(ctx.update.message.from);
    if (ctx.update.message.from.username === admin) {
        var userNameToBan = (ctx.update.message.text).slice(6);
        var userIdToBan = usernameToIDTable[userNameToBan];
        console.log(`Banning Username(@${userNameToBan}) ID:`, userIdToBan);
        ctx.reply(`@${userNameToBan} was removed from group because: Spam account`);
        ctx.tg.kickChatMember(ctx.chat.id, userIdToBan).then(function() {console.log("Ban Successful");}, function(err) {console.log("Ban was unsucessful", err);});
    } else {
        saveBadActorID(ctx);
        console.log(`@${ctx.update.message.from.username} is trying to ban`);
        ctx.tg.deleteMessage(ctx.chat.id, ctx.message.message_id);
    }
});

// Automatically deletes messages in the telegram chat that has the specific phrases in messagesToDelete
bot.hears(messagesToDelete, (ctx) => {
    saveBadActorID(ctx); 
    ctx.tg.deleteMessage(ctx.chat.id, ctx.message.message_id);
    
    if (ctx.update.message.from.username !== admin) {
        deletedMessageReply(ctx);
    } else {
        console.log("Admin is saying:", ctx.update.message.text);
    }
});

// Deletes message if there are more than 3 telegram channel mentions in the message
bot.hears(telegramRegex, (ctx) => {
    var telegramMessage = ctx.update.message.text;
    var telegramAccountMentionsCount = telegramMessage.match(telegramRegex).length;
    saveBadActorID(ctx);
    writeMessagesToJSON(ctx);

    //console.log("Telegram Username count:", telegramAccountMentionsCount);

    if (telegramAccountMentionsCount >= 3 && ctx.update.message.from.username !== admin) {
        deletedMessageReply(ctx);
        ctx.tg.deleteMessage(ctx.chat.id, ctx.message.message_id);
    }
})

//Records messages to messages.json
bot.on("message", (ctx) => {
    writeMessagesToJSON(ctx);
})


// Start bot polling in order to not terminate Node.js application.
bot.startPolling();



/**
 * Helper Functions 
 */

var saveBadActorID = (ctx) => {
    var badActorUsername = ctx.update.message.from.username;
    var badActorId = ctx.update.message.from.id;

    usernameToIDTable[badActorUsername] = badActorId;           //Save this users ID for potential ban action    
    console.log(`Saved Bad Actor(@${badActorUsername}) ID:`, badActorId);
    console.log("Updated userID table:", usernameToIDTable); 
}

var deletedMessageReply = (ctx) => {
    var badActorUsername = ctx.update.message.from.username; 
    console.log(`Message from @${badActorUsername} was deleted because: ${ctx.update.message.text}`);
    ctx.reply(`Message from @${badActorUsername} was deleted because: ${messageReason["Partner Channel"]}`);
}

var fetchMessages = () => {
    try {
        return JSON.parse(fs.readFileSync("messages.json")); 
    } catch (e) {
        return [];
    }
}

var saveMessages = (messages) => {
    fs.writeFileSync("messages.json", JSON.stringify(messages));
};

var writeMessagesToJSON = (ctx) => {
    var telegramMessage = {
        timestamp: moment.unix(ctx.update.message.date).format("DD-MM-YYYY HH:mm:ss"),
        userID: ctx.update.message.from.id,
        username: ctx.update.message.from.username,
        isReply: (ctx.update.message.entities ? true : false),
        messageText: ctx.update.message.text,
    }
    messagesForStorage = fetchMessages();
    console.log(telegramMessage);

    messagesForStorage.push(telegramMessage);

    try {
        saveMessages(messagesForStorage);
        console.log("Storage Successful");
    } catch (e) {
        console.log("Unable to store the message");
    }
}
