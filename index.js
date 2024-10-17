const app = require('express')();
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const token = process.env.BOT_TOKEN;
const AI_Token = process.env.GEMINI_API;

const bot = new TelegramBot(token, { polling: true });
const genAI = new GoogleGenerativeAI(AI_Token);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
userSelections = {};

 var chatId;

bot.onText(/\/start/, (msg) => {
    chatId = msg.chat.id;
    userSelections[chatId] = {};

    bot.sendMessage(chatId, 'Hey ' + msg.chat.first_name + '!\nI am Your Personal Bot \nHow can I Help You', {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'PYQ', callback_data: 'pyq' }],
                [{ text: 'NOTES', callback_data: 'notes' }],
                [{ text: 'Ask Question', callback_data: 'ask' }],
                [{ text: 'help', callback_data: 'help' }],
            ]
        }
    });
});

bot.onText(/\/ask/, async (msg) => {
    const prompt = msg.text.slice(5);
    console.log(prompt);
    try {
        const result = await model.generateContent([prompt]);
        console.log(result);
        bot.sendMessage(msg.chat.id, result.response.text());
    } catch (error) {
        console.error("Error generating content:", error);
        bot.sendMessage(msg.chat.id, "There was an error generating the response. Please try again later.");
    }
});

bot.on('callback_query', (callbackQuery) => {
    bot.deleteMessage(callbackQuery.message.chat.id, callbackQuery.message.message_id);

    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    if (data === 'pyq') {
        userSelections[chatId].path = './pyq';
        const keyBoard = [];
        fs.readdir(userSelections[chatId].path, (err, files) => {
            if (err) {
                return console.log('Unable to scan directory: ' + err);
            }
            files.forEach(file => {
                console.log(file);
                keyBoard.push([{ text: file, callback_data: 'branch_'+file }]);
            });
            bot.sendMessage(chatId, 'Please select your branch:', {
                reply_markup: {
                    inline_keyboard: keyBoard
                }
            });
        });
    } else if (data === 'notes') {
        bot.sendMessage(chatId, 'Sorry ' + callbackQuery.message.chat.first_name + '\nThis Feature is Under Maintanance');
    } else if (data === 'ask') {
        bot.sendMessage(chatId, 'send your Question by adding Prefix /ask \nEx:- /ask Who is PM of India');
    } else if (data === 'help') {
        bot.sendMessage(chatId, 'Sorry ' + callbackQuery.message.chat.first_name + '\nThis Feature is Under Maintanance');
    } else if (data.startsWith('branch_')) {
        const branch = data.split('_')[1];

        userSelections[chatId].branch = branch;
        userSelections[chatId].path = path.join(userSelections[chatId].path, branch);

        const keyBoard = [];
        fs.readdir(userSelections[chatId].path, (err, files) => {
            if (err) {
                return console.log('Unable to scan directory: ' + err);
            }
            files.forEach(file => {
                console.log(file);
                keyBoard.push([{ text: file, callback_data: 'sem_'+file }]);
            });
            bot.sendMessage(chatId, 'Please select your Semester:', {
                reply_markup: {
                    inline_keyboard: keyBoard
                }
            });
        });
        
    } else if (data.startsWith('sem_')) {

        const sem = data.split('_')[1];
        userSelections[chatId].sem = sem;
        userSelections[chatId].path = path.join(userSelections[chatId].path, sem);

        const keyBoard = [];
        fs.readdir(userSelections[chatId].path, (err, files) => {
            if (err) {
                return console.log('Unable to scan directory: ' + err);
            }
            files.forEach(file => {
                console.log(file);
                keyBoard.push([{ text: file, callback_data: 'exam_'+file }]);
            });
            bot.sendMessage(chatId, 'Please select Exam Type:', {
                reply_markup: {
                    inline_keyboard: keyBoard
                }
            });
        });
    } else if (data.startsWith('exam_')) {

        const examType = data.split('_')[1];
        userSelections[chatId].examType = examType;
        userSelections[chatId].path = path.join(userSelections[chatId].path, examType);
        const keyBoard = [];
        fs.readdir(userSelections[chatId].path, (err, files) => {
            if (err) {
                return console.log('Unable to scan directory: ' + err);
            }
            files.forEach(file => {
                console.log(file);
                keyBoard.push([{ text: file, callback_data: 'examYear_'+file }]);
            });
            bot.sendMessage(chatId, 'Please select the Year:', {
                reply_markup: {
                    inline_keyboard: keyBoard
                }
            });
        });

    } else if (data.startsWith('examYear_')) {
        const examYear = data.split('_')[1];
        userSelections[chatId].examYear = examYear;
        userSelections[chatId].path = path.join(userSelections[chatId].path, examYear);

        const keyBoard = [];
        fs.readdir(userSelections[chatId].path, (err, files) => {
            if (err) {
                return console.log('Unable to scan directory: ' + err);
            }
            files.forEach(file => {
                console.log(file);
                keyBoard.push([{ text: file, callback_data: 'Sub_'+file }]);
            });
            bot.sendMessage(chatId, 'Please select the Year:', {
                reply_markup: {
                    inline_keyboard: keyBoard
                }
            });
        });
    } else if (data.startsWith('Sub_')) {
        const Sub = data.split('_')[1];
        userSelections[chatId].Sub = Sub;
        userSelections[chatId].path = path.join(userSelections[chatId].path, Sub);

        const filePath = path.join(userSelections[chatId].path, `${Sub}.pdf`);
        console.log(userSelections);
        if (fs.existsSync(filePath)) {
            bot.sendDocument(chatId, filePath)
                .then(() => {
                    bot.sendMessage(chatId, ' Here is the PYQ pdf for '+ Sub + '.');
                })
                .catch((err) => {
                    bot.sendMessage(chatId, 'Failed to send the PDF. Please try again later.');
                    console.log(err);
                });
        } else {
            bot.sendMessage(chatId, 'Sorry, '+ Sub +' PYQ is not available.');
        }
    }
});

app.listen(3000, ()=>{
    console.log('Bot is running...');
});