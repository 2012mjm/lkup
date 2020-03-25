const Telegraf = require("telegraf");
const SocksAgent = require("socks5-https-client/lib/Agent");

const TextHelper = require("../../helper/TextHelper");
// const session = require("telegraf/session");

class BotService {
  constructor(
    token,
    useProxy = false,
    proxyHost = "127.0.0.1",
    proxyPort = 1080
  ) {
    const options = {};
    if (useProxy) {
      const socksAgent = new SocksAgent({
        socksHost: proxyHost,
        socksPort: proxyPort
      });
      options.agent = socksAgent;
    }

    this.bot = new Telegraf(token, { telegram: options });
    // this.bot.use(session());
    // this.bot.use(this.useAccess);
  }

  // useAccess({ from, reply }, next) {
  //   if (config.botAdminIds.indexOf(from.id) === -1) {
  //     return reply("Access deny");
  //   }
  //   return next();
  // }

  setContext(ctx) {
    this.reply = ctx.reply;
    this.text = ctx.message && ctx.message.text ? ctx.message.text : null;
    this.from = ctx.from;
    this.session = ctx.session;
  }

  setContextCallbackQuery(ctx) {
    const callbackQuery = ctx.update.callback_query;

    this.answerCbQuery = ctx.answerCbQuery;
    this.editMessageText = ctx.editMessageText;
    this.reply = ctx.reply;
    this.data = callbackQuery.data;
    this.from = callbackQuery.from;
    this.text = callbackQuery.message && callbackQuery.message.text
      ? callbackQuery.message.text
      : null;
    this.session = ctx.session;
  }

  messageEvent(ctx) {
    const reply = ctx.reply;
    const text = ctx.message && ctx.message.text ? ctx.message.text : null;
    const from = ctx.from;
    // const session = ctx.session;

    UserService.tgFindAndCreate(from).then(user => {
      // start command
      if (text === "/start" || text === sails.__("Back to home")) {
        UserService.tgUpdateState(user, "start", null);

        if (user.isAdmin) {
          reply(
            "چه کاری میتوانم برای شما انجام بدهم؟",
            this.startKeyboard(user.isAdmin)
          );
        } else {
          // reply(
          //   "پست خودت رو برای من فوروارد کن تا لایک هاشو واست بالا ببرم 😍"
          // );
          reply("شما دسترسی ندارید");
        }
      } else if (user.isAdmin && text === sails.__("Add new number")) {
        UserService.tgUpdateState(user, "add_new_number", null);

        reply(
          "شماره موبایل مورد نظر را برای من ارسال کنید\nبرای مثال: 989011231234"
        );
      } else if (user.isAdmin && text === sails.__("Join to channel")) {
        UserService.tgUpdateState(user, "join_to_channel", null);

        reply(sails.__("Enter your channel id for me"));
      } else if (user.isAdmin && text === sails.__("Increase like")) {
        UserService.tgUpdateState(user, "start", null);
        // reply(
        //   "پست خودت رو برای من فوروارد کن تا لایک هاشو واست بالا ببرم 😍"
        // );
        reply("به زودی");
      } else if (user.isAdmin && text === sails.__("Session list")) {
        SessionService.tgGetList().then(
          res => {
            reply(res.text, res.options);
          },
          err => {
            reply(err.text);
          }
        );
      } else if (
        user.isAdmin && user.tgState === "add_new_number" && text !== null
      ) {
        SessionService.addNewNumber(text).then(
          res => {
            UserService.tgUpdateState(user, "send_code", {
              phone: text,
              hash: res.hash
            });
            reply(res.message);
          },
          err => {
            reply(err);
          }
        );
      } else if (
        user.isAdmin && user.tgState === "join_to_channel" && text !== null
      ) {
        UserService.tgUpdateState(user, "join_to_channel_count", {
          channel_id: text.trim()
        });
        reply(sails.__("Enter your member for join to channel"));
      } else if (
        user.isAdmin &&
        user.tgState === "join_to_channel_count" &&
        text !== null
      ) {
        const channelUsername = JSON.parse(user.tgStateParams).channel_id;
        const count = TextHelper.fixDigit(text.trim());

        OrderService.insertByUserIdForChannel(user.id, channelUsername, count)
          .then(order => {
            reply(sails.__("Add order and waiting for join members"));

            ChannelService.joinMember(order)
              .then(() => {
                reply(
                  `${sails.__("Join member was done")} @${order.channelUsername}`
                );
              })
              .catch(err => {
                reply(`${err} @${order.channelUsername}`);
              });
          })
          .catch(err => {
            reply(err);
          });
      } else if (
        user.isAdmin && user.tgState === "send_code" && text !== null
      ) {
        const params = JSON.parse(user.tgStateParams);
        SessionService.verifyNewNumber(params.phone, text, params.hash).then(
          res => {
            UserService.tgUpdateState(user, "start", null);
            reply(res);
          },
          err => {
            reply(err);
          }
        );
      } else if (
        user.tgState === "start" &&
        msg.forward_from_chat !== undefined &&
        msg.forward_from_chat.type === "channel"
      ) {
        MessageService.getByUsernameAndId(
          user.id,
          msg.forward_from_chat.username,
          msg.forward_from_message_id
        ).then(
          message => {
            UserService.tgUpdateState(user, "get_message", {
              message_id: message.id
            });
            reply("کدوم یکی از دکمه‌های شیشه‌ای زیر رو واست فشار بدم 😊👇", {
              reply_markup: message.filterReplyMarkup
            });
          },
          () => {
            TelegramApiService.getMessageFromChannel(
              msg.forward_from_chat.username,
              msg.forward_from_message_id
            ).then(
              res => {
                MessageService.insertByUserId(user.id, {
                  tgId: res.json.id,
                  channelId: msg.forward_from_chat.id,
                  channelUsername: msg.forward_from_chat.username,
                  viaBotId: res.json.via_bot_id,
                  replyMarkup: JSON.stringify(res.json.reply_markup),
                  sessionId: res.json.sessionId
                }).then(
                  message => {
                    UserService.tgUpdateState(user, "get_message", {
                      message_id: message.id
                    });
                    reply(
                      "کدوم یکی از دکمه‌های شیشه‌ای زیر رو واست فشار بدم 😊👇",
                      { reply_markup: res.replyMarkup }
                    );
                  },
                  err => {
                    reply("مشکلی پیش اومده!");
                  }
                );
              },
              err => {
                TelegramApiService.getMessageFromChannel(
                  msg.forward_from_chat.username,
                  msg.forward_from_message_id
                ).then(
                  res => {
                    MessageService.insertByUserId(user.id, {
                      tgId: res.json.id,
                      channelId: msg.forward_from_chat.id,
                      channelUsername: msg.forward_from_chat.username,
                      viaBotId: res.json.via_bot_id,
                      replyMarkup: JSON.stringify(res.json.reply_markup),
                      sessionId: res.json.sessionId
                    }).then(
                      message => {
                        UserService.tgUpdateState(user, "get_message", {
                          message_id: message.id
                        });
                        reply(
                          "کدوم یکی از دکمه‌های شیشه‌ای زیر رو واست فشار بدم 😊👇",
                          { reply_markup: res.replyMarkup }
                        );
                      },
                      err => {
                        reply("مشکلی پیش اومده!");
                      }
                    );
                  },
                  err => {
                    reply(
                      "پستی که فوروارد کردی مشکل داره، یکبار دیگه فوروارد کن"
                    );
                  }
                );
              }
            );
          }
        );
      } else {
        // what !! I do not understand
        reply(sails.__("I do not understand"));
      }
    });
  }

  callbackQueryEvent() {
    const callbackQuery = ctx.update.callback_query;

    const answerCbQuery = ctx.answerCbQuery;
    const editMessageText = ctx.editMessageText;
    const data = callbackQuery.data;
    const from = callbackQuery.from;
    const reply = ctx.reply;
    const text = callbackQuery.message && callbackQuery.message.text
      ? callbackQuery.message.text
      : null;
    // const session = ctx.session;

    UserService.tgFindAndCreate(from).then(user => {
      const match = data.match(/^session_page_(\d+)$/i);
      if (user.isAdmin && match) {
        const page = parseInt(match[1]);

        SessionService.tgGetList(page).then(res => {
          editMessageText(res.text, res.options);
          answerCbQuery();
        });
      }

      // if (user.tgState === "get_message" && user.tgStateParams !== null) {
      //   UserService.tgUpdateState(user, "get_button");

      //   MessageService.update(JSON.parse(user.tgStateParams).message_id, {
      //     button: data
      //   }).then(message => {
      //     SessionService.getNotUse(message.id, 10000).then(
      //       sessions => {
      //         let inlineKeyboard = [];
      //         const countLikeList = [5, 30, 50, 100, 120];
      //         if (user.isAdmin) {
      //           countLikeList.push(10000);
      //           // countLikeList.push(1)
      //         }
      //         countLikeList.forEach(countLike => {
      //           if (sessions.length >= countLike) {
      //             let price = sails.config.params[`price_like_${countLike}`];
      //             inlineKeyboard.push([
      //               {
      //                 callback_data: countLike,
      //                 text:
      //                   countLike +
      //                   " لایک - " +
      //                   (price > 0 ? price + " تومان 💰" : "رایگان 😍")
      //               }
      //             ]);
      //           } else if (user.isAdmin) {
      //             let price = sails.config.params[`price_like_${countLike}`];
      //             inlineKeyboard.push([
      //               {
      //                 callback_data: countLike,
      //                 text:
      //                   (countLike === 10000 ? "نامحدود" : countLike) +
      //                   " لایک - " +
      //                   (price > 0 ? price + " تومان 💰" : "رایگان 😍")
      //               }
      //             ]);
      //           }
      //         });

      //         if (inlineKeyboard.length === 0) {
      //           UserService.tgUpdateState(user, "start", null);
      //           sails.tgBot.editMessageText(
      //             "بیشتر از این نمیتونم پستت رو لایک کنم 😞\nاگه پست دیگه ای داری واسم فوروارد کن تا لایک‌هاشو واست بالا ببرم 😉",
      //             {
      //               message_id: messageId,
      //               chat_id: chatId
      //             }
      //           );
      //         } else {
      //           sails.tgBot.editMessageText("چند تا لایک میخوایی؟ 😎", {
      //             message_id: messageId,
      //             chat_id: chatId,
      //             reply_markup: { inline_keyboard: inlineKeyboard }
      //           });
      //         }
      //       },
      //       err => {
      //         UserService.tgUpdateState(user, "start", null);
      //         sails.tgBot.editMessageText(
      //           "بیشتر از این نمیتونم پستت رو لایک کنم 😞\nاگه پست دیگه ای داری واسم فوروارد کن تا لایک‌هاشو واست بالا ببرم 😉",
      //           {
      //             message_id: messageId,
      //             chat_id: chatId
      //           }
      //         );
      //       }
      //     );
      //   });
      //   sails.tgBot.answerCallbackQuery({ callback_query_id: callId });
      // } else if (user.tgState === "get_button" && user.tgStateParams !== null) {
      //   const countLike = parseInt(data);
      //   const price = sails.config.params[`price_like_${data}`];
      //   MessageService.findById(JSON.parse(user.tgStateParams).message_id).then(
      //     message => {
      //       OrderService.insertByUserId(user.id, {
      //         messageId: message.id,
      //         countLike: countLike,
      //         type: price > 0 ? "coin" : "join"
      //       }).then(order => {
      //         UserService.tgUpdateState(user, "start", null);

      //         if (price > 0) {
      //           PaymentService.zarinpalRequest(user, price).then(zarinpal => {
      //             OrderService.update(order.id, {
      //               paymentId: zarinpal.payment.id
      //             }).then();
      //             sails.tgBot.editMessageText(
      //               "روی دکمه شیشه‌ای زیر کلیک کن تا به درگاه پرداخت آنلاین منتقلت کنم 🙂",
      //               {
      //                 message_id: messageId,
      //                 chat_id: chatId,
      //                 reply_markup: {
      //                   inline_keyboard: [
      //                     [
      //                       {
      //                         text: "پرداخت مبلغ " + price + " تومان",
      //                         url: zarinpal.url
      //                       }
      //                     ]
      //                   ]
      //                 }
      //               }
      //             );
      //           });
      //         } else {
      //           OrderService.isUseFree(user).then(
      //             res => {
      //               reply(
      //                 "شرمنده شما یکبار از سرویس رایگان من استفاده کردید. 😯"
      //               );
      //             },
      //             err => {
      //               OrderService.update(order.id, { status: "working" }).then();
      //               MessageService.addLike(order).then(res => {
      //                 reply(
      //                   "به تعدادی که خواستی پستت رو لایک کردم 😍\nاگه نظری یا پیشنهادی داری با سازنده من تماس بگیر @javad010"
      //                 );
      //               });
      //               // sails.tgBot.editMessageText(
      //               //   "الان شروع میکنم به لایک پستت، تموم که شد خودم همینجا بهت پیام میدم\nاگه پست دیگه‌ای هم داری واسم فوروارد کن",
      //               //   {
      //               //     message_id: messageId,
      //               //     chat_id: chatId
      //               //   }
      //               // );
      //             }
      //           );
      //         }
      //         sails.tgBot.answerCallbackQuery({ callback_query_id: callId });
      //       });
      //    }
      //  );
      // }
    });
  }

  inlineQueryEvent(inlineQuery) {
    const query = inlineQuery.query;
    const from = inlineQuery.from;
    const requestId = inlineQuery.id;
  }

  startKeyboard(isAdmin = false) {
    let keyboard = null;
    if (isAdmin) {
      keyboard = {
        reply_markup: {
          resize_keyboard: true,
          keyboard: [
            [
              {
                text: sails.__("Add new number")
              },
              {
                text: sails.__("Session list")
              }
            ],
            [
              {
                text: sails.__("Join to channel")
              }
            ]
          ]
        }
      };
    }
    return keyboard;
  }

  confirmKeyboard() {
    return {
      reply_markup: {
        resize_keyboard: true,
        keyboard: [
          [
            {
              text: sails.__("No")
            },
            {
              text: sails.__("Yes")
            }
          ]
        ]
      }
    };
  }

  showMoreKeyboard() {
    return {
      reply_markup: {
        resize_keyboard: true,
        keyboard: [
          [
            {
              text: sails.__("Back to home")
            },
            {
              text: sails.__("Show more")
            }
          ]
        ]
      }
    };
  }

  multiSendMessageByType(chatId, posts, options = {}, index = 0) {
    this.sendMessageByType(chatId, posts[index], options).then(
      () => {
        this.multiSendMessageByType(chatId, posts, options, index + 1);
      },
      () => {
        return;
      }
    );
  }
}

module.exports = BotService;
