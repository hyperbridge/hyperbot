/**
 * Telegram Bot for Hyperbridge Organization
 * Website: https://hyperbridge.org/
 * 
 * Modified from Fabio Crispino aka Finalgalaxy
 */


const Telegraf = require('telegraf');   // Module to use Telegraf API.
const {Extra, Markup} = Telegraf;   // Extract Extra, Markups from Telegraf module.
const config = require('./config'); // Configuration file that holds telegraf_token API key.
const axios = require("axios");

const admin = "ashtqz";

var usernameToIDTable = {fr0stbyte2: 420734418, JPCullen: 489252909};         //Dictionary for mapping usernames to ID

const bot = new Telegraf(config.telegraf_token);    // Let's instantiate a bot using our token.

// We can get bot nickname from bot informations. This is particularly useful for groups.
bot.telegram.getMe().then((bot_informations) => {
    bot.options.username = bot_informations.username;
    console.log("Server has initialized bot nickname. Nick: "+bot_informations.username);
});

//Save usernames and ID's for new members
bot.on('new_chat_members', (ctx) => {
    console.log(ctx.message.new_chat_members);
    var newUsername = ctx.message.new_chat_members[0].username;
    console.log(`Type of Username:`, typeof newUsername);
    var newUserID = ctx.message.new_chat_members[0].id;
    usernameToIDTable[newUsername] = newUserID;
    console.log(usernameToIDTable);
});

// Admin can ban by username
// Format: !ban @exampleUsername
bot.hears(/!ban/i, (ctx) => {
    console.log(ctx.update.message.from);
    console.log(ctx.update.message.text);
    if (ctx.update.message.from.username === admin) {
        var userNameToBan = (ctx.update.message.text).slice(6);
        var userIdToBan = usernameToIDTable[userNameToBan];
        console.log("User ID to Ban:", userIdToBan, "Type:", typeof userIdToBan);
        console.log("chat ID:", ctx.chat.id);
        ctx.tg.kickChatMember(ctx.chat.id, userIdToBan).then(function() {console.log("Ban Successful");}, function(err) {console.log("Ban was unsucessful", err);});
    } else {
        console.log("Someone is trying to ban");
    }
});

bot.hears(/Join my Telegram/i, (ctx) => {
    //console.log(ctx.message);
    var userIdToBan = ctx.update.message.from.id;
    //console.log("type of ID:", typeof userIdToBan);
    //console.log(userIdToBan);
    //console.log(ctx);
    if (ctx.update.message.from.username !== admin) {
        ctx.tg.deleteMessage(ctx.chat.id, ctx.message.message_id);
        ctx.tg.kickChatMember(ctx.chat.id, userIdToBan).then(function() {console.log("Ban Successful");}, function() {console.log("Ban was unsucessful");});
    } else {
        console.log("Admin is saying 'Join my Telegram'");
    }
    
});



// Start bot polling in order to not terminate Node.js application.
bot.startPolling();



//Original Code 

// Command example, pretty easy. Each callback passes as parameter the context.
// Context data includes message info, timestamp, etc; check the official documentation or print ctx.
//bot.command('start', (ctx) => ctx.reply('Bot started.'));

// Hears, instead of command, check if the given word or regexp is CONTAINED in user input and not necessarly at beginning.
//bot.hears('ymca', (ctx) => ctx.reply("*sing* It's fun to stay at the Y.M.C.A.!"));
//bot.hears(/torino/i, (ctx) => ctx.reply("Someone said Torino!?"));

//bot.hears(/!delete/i, (ctx) => ctx.tg.deleteMessage(ctx.chat.id, ctx.message.message_id));

// Inline query support (@yourbot query). Can be used anywhere, even in groups. It works just like @gif bot.
// bot.on('inline_query', ctx => {
//     let query = ctx.update.inline_query.query;  // If you analyze the context structure, query field contains our query.
//     if(query.startsWith("/")){  // If user input is @yourbot /command
//         if(query.startsWith("/audio_src")){ // If user input is @yourbot /audio_src
//             // In this case we answer with a list of ogg voice data.
//             // It will be shown as a tooltip. You can add more than 1 element in this JSON array. Check API usage "InlineResultVoice".
//             return ctx.answerInlineQuery([
//                 {
//                     type: 'voice',  // It's a voice file.
//                     id: ctx.update.inline_query.id,    // We reflect the same ID of the request back.
//                     title: 'Send audio file sample.ogg',    // Message appearing in tooltip.
//                     voice_url: 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Example.ogg',
//                     voice_duration: 16, // We can specify optionally the length in seconds.
//                     caption: '[BOT] Audio file sample.ogg!' // What appears after you send voice file.
//                 }
//             ]);
//         }
//     }else{  // If user input is @yourbot name
//         let name_target = query;    // Let's assume the query is actually the name.
//         let message_length = name_target.length;    // Name length. We want to ensure it's > 0.
//         if(message_length > 0){
//             let full_message;
//             let dice=Math.floor(Math.random()*8)+1; // Let's throw a dice for a random message. (1, 8)
//             switch(dice){
//                 case 1: full_message = "IMHO, "+name_target+" sucks."; break;
//                 case 2: full_message = "IMHO, "+name_target+" is awesome"; break;
//                 case 3: full_message = name_target+" is not a nice people for me..."; break;
//                 case 4: full_message = name_target+" for me you are c- Eh! You wanted!"; break;
//                 case 5: full_message = "Whoa! "+name_target+" is very cool!"; break;
//                 case 6: full_message = "Grifondoro! No wait, "+name_target+" you're such a noob."; break;
//                 case 7: full_message = "Sometimes I ask myself why people like "+name_target+" dress up and walk around like that..."; break;
//                 case 8: full_message = "Watch him! Watch! "+name_target+" is so ugly!"; break;
//             }
//             // Let's return a single tooltip, not cached (In order to always change random value).
//             return ctx.answerInlineQuery([{
//                 type: 'article',
//                 id: ctx.update.inline_query.id, 
//                 title: 'You have inserted: '+name_target, 
//                 description: 'What does '+bot.options.username+' thinks about '+name_target+'?',
//                 input_message_content: {message_text: full_message}
//             }], {cache_time: 0});
//         }
//     }
// })