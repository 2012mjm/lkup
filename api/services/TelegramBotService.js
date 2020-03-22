const TextHelper = require('../../helper/TextHelper')
const rp = require('request-promise')

let self = module.exports = {

  messageEvent: (msg) => {
    const from = msg.from
    const text = (msg.text !== undefined) ? msg.text : null
    const chatId = msg.chat.id

    UserService.tgFindAndCreate(from).then(user =>
    {
      // start command
      if(text === '/start' || text === sails.__('Back to home')) {
        UserService.tgUpdateState(user, 'start', null)
        if(user.isAdmin) {
          sails.tgBot.sendMessage(chatId, 'چه کاری میتوانم برای شما انجام بدهم؟', self.startKeyboard(user.isAdmin)).then()
        } else {
          sails.tgBot.sendMessage(chatId, 'پست خودت رو برای من فوروارد کن تا لایک هاشو واست بالا ببرم 😍').then()
        }
      }
      else if(user.isAdmin && text === sails.__('Add new number')) {
        UserService.tgUpdateState(user, 'add_new_number', null)
        sails.tgBot.sendMessage(chatId, 'شماره موبایل مورد نظر را برای من ارسال کنید\nبرای مثال: 989011231234').then()
      }
      else if(user.isAdmin && text === sails.__('Increase like')) {
        UserService.tgUpdateState(user, 'start', null)
        sails.tgBot.sendMessage(chatId, 'پست خودت رو برای من فوروارد کن تا لایک هاشو واست بالا ببرم 😍').then()
      }
      else if(user.isAdmin && user.tgState === 'add_new_number' && text !== null) {
        SessionService.addNewNumber(text).then(res => {
          UserService.tgUpdateState(user, 'send_code', {phone: text})
          sails.tgBot.sendMessage(chatId, res).then()
        }, err => {
          sails.tgBot.sendMessage(chatId, err).then()
        })
      }
      else if(user.isAdmin && user.tgState === 'send_code' && text !== null) {
        const phone = JSON.parse(user.tgStateParams).phone
        SessionService.verifyNewNumber(phone, text).then(res => {
          UserService.tgUpdateState(user, 'start', null)
          sails.tgBot.sendMessage(chatId, res).then()
        }, err => {
          sails.tgBot.sendMessage(chatId, err).then()
        })
      }
      else if(user.tgState === 'start' && msg.forward_from_chat !== undefined && msg.forward_from_chat.type === 'channel') {
        MessageService.getByUsernameAndId(user.id, msg.forward_from_chat.username, msg.forward_from_message_id).then(message => {
          UserService.tgUpdateState(user, 'get_message', {message_id: message.id})
          sails.tgBot.sendMessage(chatId, 'کدوم یکی از دکمه‌های شیشه‌ای زیر رو واست فشار بدم 😊👇', {reply_markup: message.filterReplyMarkup}).then()
        }, () => {
          TelegramApiService.getMessageFromChannel(msg.forward_from_chat.username, msg.forward_from_message_id).then(res => {
            MessageService.insertByUserId(user.id, {
              tgId: res.json.id,
              channelId: msg.forward_from_chat.id,
              channelUsername: msg.forward_from_chat.username,
              viaBotId: res.json.via_bot_id,
              replyMarkup: JSON.stringify(res.json.reply_markup),
              sessionId: res.json.sessionId
            }).then(message => {
              UserService.tgUpdateState(user, 'get_message', {message_id: message.id})
              sails.tgBot.sendMessage(chatId, 'کدوم یکی از دکمه‌های شیشه‌ای زیر رو واست فشار بدم 😊👇', {reply_markup: res.replyMarkup}).then()
            }, (err) => {
              sails.tgBot.sendMessage(chatId, 'مشکلی پیش اومده!').then()
            })
          }, (err) => {
            TelegramApiService.getMessageFromChannel(msg.forward_from_chat.username, msg.forward_from_message_id).then(res => {
              MessageService.insertByUserId(user.id, {
                tgId: res.json.id,
                channelId: msg.forward_from_chat.id,
                channelUsername: msg.forward_from_chat.username,
                viaBotId: res.json.via_bot_id,
                replyMarkup: JSON.stringify(res.json.reply_markup),
                sessionId: res.json.sessionId
              }).then(message => {
                UserService.tgUpdateState(user, 'get_message', {message_id: message.id})
                sails.tgBot.sendMessage(chatId, 'کدوم یکی از دکمه‌های شیشه‌ای زیر رو واست فشار بدم 😊👇', {reply_markup: res.replyMarkup}).then()
              }, (err) => {
                sails.tgBot.sendMessage(chatId, 'مشکلی پیش اومده!').then()
              })
            }, (err) => {
              sails.tgBot.sendMessage(chatId, 'پستی که فوروارد کردی مشکل داره، یکبار دیگه فوروارد کن').then()
            })
          })
        })
      }
      // what !! I do not understand
      else {
        sails.tgBot.sendMessage(chatId, sails.__('I do not understand')).then()
      }
    })
  },

  callbackQueryEvent: (callbackQuery) => {
    const data      = callbackQuery.data
    const from      = callbackQuery.from
    const messageId = (callbackQuery.message !== undefined) ? callbackQuery.message.message_id : null
    const chatId    = (callbackQuery.message !== undefined) ? callbackQuery.message.chat.id : null
    const callId    = callbackQuery.id

    UserService.tgFindAndCreate(from).then(user =>
    {
      if(user.tgState === 'get_message' && user.tgStateParams !== null) {
        UserService.tgUpdateState(user, 'get_button')

        MessageService.update(JSON.parse(user.tgStateParams).message_id, {button: data}).then(message => {
          SessionService.getNotUse(message.id, 10000).then(sessions => {
            let inlineKeyboard = []
            const countLikeList = [5, 30, 50, 100, 120]
            if(user.isAdmin) {
              countLikeList.push(10000)
              // countLikeList.push(1)
            }
            countLikeList.forEach(countLike => {
              if(sessions.length >= countLike) {
                let price = sails.config.params[`price_like_${countLike}`]
                inlineKeyboard.push([{
                  callback_data: countLike,
                  text: countLike + ' لایک - ' + (price > 0 ? price+' تومان 💰' : 'رایگان 😍')
                }])
              }
              else if(user.isAdmin) {
                let price = sails.config.params[`price_like_${countLike}`]
                inlineKeyboard.push([{
                  callback_data: countLike,
                  text: (countLike === 10000 ? 'نامحدود' : countLike) + ' لایک - ' + (price > 0 ? price+' تومان 💰' : 'رایگان 😍')
                }])
              }
            })

            if(inlineKeyboard.length === 0) {
              UserService.tgUpdateState(user, 'start', null)
              sails.tgBot.editMessageText('بیشتر از این نمیتونم پستت رو لایک کنم 😞\nاگه پست دیگه ای داری واسم فوروارد کن تا لایک‌هاشو واست بالا ببرم 😉', {
                message_id: messageId,
                chat_id: chatId
              })
            }
            else {
              sails.tgBot.editMessageText('چند تا لایک میخوایی؟ 😎', {
                message_id: messageId,
                chat_id: chatId,
                reply_markup: {inline_keyboard: inlineKeyboard}
              })
            }
          }, err => {
            UserService.tgUpdateState(user, 'start', null)
            sails.tgBot.editMessageText('بیشتر از این نمیتونم پستت رو لایک کنم 😞\nاگه پست دیگه ای داری واسم فوروارد کن تا لایک‌هاشو واست بالا ببرم 😉', {
              message_id: messageId,
              chat_id: chatId
            })
          })
        })
        sails.tgBot.answerCallbackQuery({callback_query_id: callId})
      }
      else if(user.tgState === 'get_button' && user.tgStateParams !== null) {
        const countLike = parseInt(data)
        const price = sails.config.params[`price_like_${data}`]
        MessageService.findById(JSON.parse(user.tgStateParams).message_id).then(message => {
          OrderService.insertByUserId(user.id, {
            messageId: message.id,
            countLike: countLike,
            type: (price > 0) ? 'coin' : 'join'
          }).then(order => {
            UserService.tgUpdateState(user, 'start', null)

            if(price > 0) {
              PaymentService.zarinpalRequest(user, price).then(zarinpal => {
                OrderService.update(order.id, {paymentId: zarinpal.payment.id}).then()
                sails.tgBot.editMessageText('روی دکمه شیشه‌ای زیر کلیک کن تا به درگاه پرداخت آنلاین منتقلت کنم 🙂', {
                  message_id: messageId,
                  chat_id: chatId,
                  reply_markup: {
                    inline_keyboard: [[{
                      text: 'پرداخت مبلغ ' + price + ' تومان',
                      url: zarinpal.url
                    }]]
                  }
                })
              })
            }
            else {
              OrderService.isUseFree(user).then(res => {
                sails.tgBot.sendMessage(user.tgId, 'شرمنده شما یکبار از سرویس رایگان من استفاده کردید. 😯').then()
              }, err => {
                OrderService.update(order.id, {status: 'working'}).then()
                MessageService.addLike(order).then(res => {
                  sails.tgBot.sendMessage(user.tgId, 'به تعدادی که خواستی پستت رو لایک کردم 😍\nاگه نظری یا پیشنهادی داری با سازنده من تماس بگیر @javad010').then()
                })
                sails.tgBot.editMessageText('الان شروع میکنم به لایک پستت، تموم که شد خودم همینجا بهت پیام میدم\nاگه پست دیگه‌ای هم داری واسم فوروارد کن', {
                  message_id: messageId,
                  chat_id: chatId
                })
              })
            }
            sails.tgBot.answerCallbackQuery({callback_query_id: callId})
          })
        })
      }
    })
  },

  inlineQueryEvent: (inlineQuery) => {
    const query = inlineQuery.query
    const from = inlineQuery.from
    const requestId = inlineQuery.id
  },

  startKeyboard: (isAdmin=false) => {
    let keyboard = null
    if(isAdmin) {
      keyboard = {reply_markup: {
        resize_keyboard: true,
        keyboard: [
          [{
            text: sails.__('Add new number')
          }, {
            text: sails.__('Increase like')
          }]
        ]
      }}
    }
    return keyboard
  },

  confirmKeyboard: () => {
    return {reply_markup: {
      resize_keyboard: true,
      keyboard: [
        [{
          text: sails.__('No')
        }, {
          text: sails.__('Yes')
        }]
      ]
    }}
  },

  showMoreKeyboard: () => {
    return {reply_markup: {
      resize_keyboard: true,
      keyboard: [
        [{
          text: sails.__('Back to home')
        }, {
          text: sails.__('Show more')
        }]
      ]
    }}
  },

  multiSendMessageByType: (chatId, posts, options = {}, index=0) => {
    self.sendMessageByType(chatId, posts[index], options).then(() => {
      self.multiSendMessageByType(chatId, posts, options, index+1)
    }, () => {
      return
    })
  }
}
