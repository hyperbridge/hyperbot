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
 * - Saves all messages to messages.csv
 * - Add new messages to delete (Admin Only)
 */


const Telegraf = require('telegraf');   // Module to use Telegraf API.
const {Extra, Markup} = Telegraf;   // Extract Extra, Markups from Telegraf module.
const config = require('./config'); // Configuration file that holds telegraf_token API key.
const axios = require("axios");
const fs = require("fs");
const moment = require("moment");

const admin =   ["ashtqz",
                "fr0stbyte2",
                "JPCullen",
                "drandalm"];

var usernameToIDTable = {fr0stbyte2: 420734418, JPCullen: 489252909};         //Dictionary for mapping usernames to ID
var messagesToDelete = [/Join my/gi, /Partner Channel/gi, /Make money/gi];
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
    if (checkIfAdmin(ctx)) {
        var userNameToBan = (ctx.update.message.text).slice(6);
        var userIdToBan = usernameToIDTable[userNameToBan];
        try {
            console.log(`Banning Username(@${userNameToBan}) ID:`, userIdToBan);
            ctx.tg.kickChatMember(ctx.chat.id, userIdToBan);
            console.log("Ban Successful");
            ctx.reply(`@${userNameToBan} was removed from group because: Spam account`);            
        } catch (e) {
            console.log("Ban Unsuccessful");
            console.log(e);
        }
    } else {
        saveUserID(ctx);
        console.log(`@${ctx.update.message.from.username} is trying to ban`);
        ctx.tg.deleteMessage(ctx.chat.id, ctx.message.message_id);
    }
});

//Add new messages to delete 
//Format: !newMessageToDelete Partner Channel
bot.hears(/!newMessageToDelete/i, (ctx) => {
    if(checkIfAdmin(ctx)) {
        var theRegexToDelete = new RegExp((ctx.update.message.text).slice(20), "gi");
        console.log(`Added new Regex to delete: ${theRegexToDelete}`);
        messagesToDelete.push(theRegexToDelete); 
        console.log(messagesToDelete);
    } else {
        saveUserID(ctx);
        console.log(`@${ctx.update.message.from.username} is trying to add new messages to delete`);
        ctx.tg.deleteMessage(ctx.chat.id, ctx.message.message_id);
    }
})

// Records messages to messages.csv
// Save messages in this format: Timestamp,UserID,Username,IsReply,Message
// Automatically deletes messages that match regex 
bot.on("message", (ctx) => {
    saveUserID(ctx);
    if (ctx.update.message.text)
    try {
        appendToFile(ctx, "messages.csv");
        console.log("Successfully saved message");
        if (matchesCommand(ctx.update.message.text) && !checkIfAdmin(ctx)) {
            ctx.tg.deleteMessage(ctx.chat.id, ctx.message.message_id);
            deletedMessageReply(ctx);
        } else if (matchesCommand(ctx.update.message.text) && checkIfAdmin(ctx)){
            console.log("Admin is saying:", ctx.update.message.text);        
        }
    } catch (e) {
        console.log("Unsuccessful in saving new message");
        console.log(e);
    }
})


// Deletes message if there are more than 3 telegram channel mentions in the message
bot.hears(telegramRegex, (ctx) => {
    var telegramMessage = ctx.update.message.text;
    var telegramAccountMentionsCount = telegramMessage.match(telegramRegex).length;
    saveUserID(ctx);
    try {
        appendToFile(ctx, "messages.csv");
    } catch (e) {
        console.log("Unsuccessful in saving new message");
        console.log(e);
    }

    //console.log("Telegram Username count:", telegramAccountMentionsCount);

    if (telegramAccountMentionsCount >= 3 && ctx.update.message.from.username !== admin) {
        deletedMessageReply(ctx);
        ctx.tg.deleteMessage(ctx.chat.id, ctx.message.message_id);
    }
})




// Start bot polling in order to not terminate Node.js application.
bot.startPolling();













/**
 * Helper Functions 
 */

var saveUserID = (ctx) => {
    var badActorUsername = ctx.update.message.from.username;
    var badActorId = ctx.update.message.from.id;

    usernameToIDTable[badActorUsername] = badActorId;           //Save this users ID for potential ban action    
    console.log(`Saved Username:(@${badActorUsername}) ID:`, badActorId);
    console.log("Updated userID table:", usernameToIDTable); 
}

var deletedMessageReply = (ctx) => {
    var badActorUsername = ctx.update.message.from.username; 
    console.log(`Message from @${badActorUsername} was deleted because: ${ctx.update.message.text}`);
    ctx.reply(`Message from @${badActorUsername} was deleted because: ${messageReason["Partner Channel"]}`);
}

var checkIfAdmin = (ctx) => {
    if (admin.indexOf(ctx.update.message.from.username) !== -1) {
        return true;
    } else {
        return false;
    }
}

// Save messages in this format: Timestamp,UserID,Username,IsReply,Message
var appendToFile = (ctx, storageFile) => {
    messageText = (ctx.update.message.text).replace(/(\r\n|\n|\r)/gm," ");  //Remove line breaks
    
    if (storageFile === "messages.csv") {
        var telegramMessage = `\n${moment.unix(ctx.update.message.date).format("DD-MM-YYYY HH:mm:ss")},${ctx.update.message.from.id},${ctx.update.message.from.username},${(ctx.update.message.entities ? true : false)},"${messageText}"`
    } 

    console.log(telegramMessage);

    try {
        fs.appendFileSync(storageFile, (`${telegramMessage}`));        
    } catch (e) {
        console.log("Unable to store the message");
        console.log("Error Message:" + e);        
    }
}

const matchesCommand = (text) => {
    for (var i in messagesToDelete) {
        if (text.match(messagesToDelete[i])) {
            return true
        }
    }
    return false
}




// //Admin can add new Admins -> be able to add to admins to the bot without
// bot.hears(/!addAdmin/i, (ctx) => {
//     if(checkIfAdmin(ctx)) {
//         var userNameToAdd = (ctx.update.message.text).slice(11);
//         admin.push(userNameToAdd);
//     } else {
//         saveUserID(ctx);
//         console.log(`@${ctx.update.message.from.username} is trying to add new admins`);
//         ctx.tg.deleteMessage(ctx.chat.id, ctx.message.message_id);
//     }
// })
