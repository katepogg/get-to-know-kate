require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

const users = {};

const questions = [
  {
    key: "name",
    text: "What's your name?",
    type: "text"
  },
  {
    key: "age",
    text: "How old are you?",
    type: "text"
  },
  {
    key: "hobby",
    text: "Pick a hobby 🎯",
    type: "buttons",
    options: ["Music", "Sports", "Gaming", "Reading", "Others"]
  }
];

// /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  users[chatId] = {
    step: -1,
    answers: {},
    waitingForCustomHobby: false
  };

  bot.sendMessage(chatId, "Hi! Want to do a quick get-to-know-you chat? 😊", {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "Yes 👍", callback_data: "start_yes" },
          { text: "No 👋", callback_data: "start_no" }
        ]
      ]
    }
  });
});

// Button clicks
bot.on("callback_query", (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  const user = users[chatId];

  if (!user) return;
  bot.answerCallbackQuery(query.id);

  if (data === "start_no") {
    bot.sendMessage(chatId, "No worries! Come back anytime 😊");
    delete users[chatId];
    return;
  }

  if (data === "start_yes") {
    user.step = 0;
    bot.sendMessage(chatId, questions[0].text);
    return;
  }

  // Hobby buttons
  if (data.startsWith("answer_")) {
    const value = data.replace("answer_", "");
    const current = questions[user.step];

    // Handle "Others"
    if (current.key === "hobby" && value === "Others") {
      user.waitingForCustomHobby = true;
      bot.sendMessage(chatId, "Cool! Tell me your hobby 🙂");
      return;
    }

    user.answers[current.key] = value;
    user.step++;

    if (user.step < questions.length) {
      sendQuestion(chatId, user);
    } else {
      finish(chatId, user);
    }
  }
});

// Text answers
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  const user = users[chatId];

  if (!user || text.startsWith("/")) return;

  // Custom hobby input
  if (user.waitingForCustomHobby) {
    user.answers.hobby = text;
    user.waitingForCustomHobby = false;
    user.step++;

    finish(chatId, user);
    return;
  }

  const current = questions[user.step];
  if (!current || current.type !== "text") return;

  user.answers[current.key] = text;
  user.step++;

  if (user.step < questions.length) {
    sendQuestion(chatId, user);
  } else {
    finish(chatId, user);
  }
});

// Helpers
function sendQuestion(chatId, user) {
  const q = questions[user.step];

  if (q.type === "buttons") {
    bot.sendMessage(chatId, q.text, {
      reply_markup: {
        inline_keyboard: q.options.map(opt => [
          {
            text: opt,
            callback_data: `answer_${opt}`
          }
        ])
      }
    });
  } else {
    bot.sendMessage(chatId, q.text);
  }
}

function finish(chatId, user) {
  const { name, age, hobby } = user.answers;

  bot.sendMessage(
    chatId,
    `Nice to meet you! 🎉\n\n` +
    `👤 Name: ${name}\n` +
    `🎂 Age: ${age}\n` +
    `🎯 Hobby: ${hobby}`
  );

  delete users[chatId];
}

console.log("Kate Po Bot is running...");
