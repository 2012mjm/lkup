const TextHelper = require('../../helper/TextHelper')
const moment = require('moment')
const persianJs = require('persianjs')
const jMoment = require('jalali-moment')
jMoment.loadPersian()

let self = module.exports = {
  insertByUserId: (userId, attr) => {
    return new Promise((resolve, reject) =>
    {
      Like.create({
        userId: userId,
        messageId: attr.messageId,
        sessionId: attr.sessionId,
        orderId: attr.orderId,
        status: (attr.status) ? 1 : 0,
        createdAt: moment().format('YYYY-MM-DD HH:mm:ss')
      }).exec((err, row) => {
        if (err) {
          return reject(err)
        }
        resolve(row)
      })
    })
  },

  updateStatus: (id, status) => {
    return new Promise((resolve, reject) => {
      Like.update({id: id}, {status: ((status) ? '1' : '0')}).exec((err, updated) => {
        if(err) return reject(err)
        resolve(updated[0])
      })
    })
  },
}
