const TextHelper = require('../../helper/TextHelper')
const moment = require('moment')
const persianJs = require('persianjs')
const jMoment = require('jalali-moment')
jMoment.loadPersian()

let self = module.exports = {
  insertByUserId: (userId, attr) => {
    return new Promise((resolve, reject) =>
    {
      Message.create({
        userId: userId,
        tgId: attr.tgId,
        channelId: attr.channelId,
        channelUsername: attr.channelUsername,
        countLike: 0,
        readSessionId: attr.sessionId,
        replyMarkup: attr.replyMarkup,
        viaBotId: attr.viaBotId,
        createdAt: moment().format('YYYY-MM-DD HH:mm:ss')
      }).exec((err, row) => {
        if (err) {
          return reject(err)
        }
        resolve(row)
      })
    })
  },

  update: (id, updateAttr) => {
    return new Promise((resolve, reject) => {
      Message.update({id: id}, updateAttr).exec((err, updated) => {
        if(err) return reject(err)
        resolve(updated[0])
      })
    })
  },

  findById: (id) => {
    return new Promise((resolve, reject) => {
      Message.findOne({id: id}, (err, model) => {
        if (err || !model) return reject(sails.__('Your post not found'))
        return resolve(model)
      })
    })
  },

  getByUsernameAndId: (userId, channelUsername, id) => {
    return new Promise((resolve, reject) => {
      Message.findOne({tgId: id, userId: userId, channelUsername: channelUsername}, (err, model) => {
        if (err || !model) return reject(sails.__('not found'))

        let newJson = []
        JSON.parse(model.replyMarkup).forEach(arr => {
          let newInJson = []
          arr.forEach(val => {
            if(val._ === 'keyboardButtonCallback') {
              newInJson.push(val)
            }
          })
          if(newInJson.length > 0) newJson.push(newInJson)
        })
        model.filterReplyMarkup = {inline_keyboard: newJson}
        return resolve(model)
      })
    })
  },

  addLike: (order) => {
    return new Promise((resolve, reject) => {
      self.findById(order.messageId).then(message => {
        let c=0
        SessionService.getNotUse(message.id, order.countLike).then(sessions => {
          sessions.forEach(session => {
            TelegramApiService.clickOnButton(session, message.channelUsername, message.tgId, message.button).then(res => {
              c++
              LikeService.insertByUserId(order.userId, {messageId: message.id, sessionId: session.id, orderId: order.id, status: true}).then()
              self.addCountLike(order.messageId).then()
              if(c >= order.countLike) {
                OrderService.update(order.id, {status: 'done'}).then()
                return resolve()
              }
            }, err => {
              LikeService.insertByUserId(order.userId, {messageId: message.id, sessionId: session.id, orderId: order.id, status: false}).then()
            })
          })
        })
      })
    })
  },

  addCountLike: (id) => {
    return new Promise((resolve, reject) => {
      self.findById(id).then(message => {
        self.update(id, {countLike: message.countLike+1}).then(resolve, reject)
      }, reject)
    })
  }
}
