# Telegram Bot for Hyperbridge Organization Telegram Channel

## Telegram Channel: https://t.me/hyperbridgechat

## Modified From: Fabio Crispino aka Finalgalaxy Telegram Bot in NodeJS

## How to create the bot

### Step 1: create a 'user bot' and connect it with Node.js
- Open Telegram application on your computer;
- Contact BotFather through Telegram here: https://telegram.me/BotFather. This bot will be used to create your bot;
- As image suggests, follow those steps:
![image](http://i.imgur.com/POZq2tq.png)
- BotFather will provide you an API key. This API key is used to make requests to Telegram API in order to listen messages from your bot user, make bot answer accordingly and much more. Save it for next step.

### Step 2: configure your Node.js application
- Create config.js in the repository root with this content. Replace API_TOKEN with the API key you got from BotFather:
```javascript
module.exports = {telegraf_token:'API_TOKEN'};
```
This file will be automatically ignored from .gitignore to secure your API key in GitHub.


- Install dependencies:
```
npm install
```
This will install all dependencies in `package.json` so just `telegraf` in order to use Telegram API.

Done! Your bot is now configured.

## Run the bot
- Start your application:
```
npm start
```
If it prints:
```
[SERVER] Bot started.
```
...congratulations! Now bot will do what you want.


For more informations, check Telegraf API: https://github.com/telegraf/telegraf.
For inline support results, check: https://core.telegram.org/bots/api#inlinequeryresult.
