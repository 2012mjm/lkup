const moment = require('moment')
const zarinpalCheckout = require('zarinpal-checkout')
const uuidv1 = require('uuid/v1')
const TextHelper = require('../../helper/TextHelper')
const persianJs = require('persianjs')
const jMoment = require('jalali-moment')
jMoment.loadPersian()

let self = module.exports = {

  insertByUserId: (userId, amount, gateway) => {
    return new Promise((resolve, reject) =>
    {
      Payment.create({
        userId: userId,
        amount: amount,
        gateway: gateway,
        trackingCode: uuidv1(),
        createdAt: moment().format('YYYY-MM-DD HH:mm:ss')
      }).exec((err, row) => {
        if (err) {
          return reject(err)
        }
        resolve(row)
      })
    })
  },

  update: (id, statusCode, status, reffererCode) => {
    return new Promise((resolve, reject) =>
    {
      Payment.update({id: id}, {
        statusCode: parseInt(statusCode),
        status: status,
        reffererCode: reffererCode
      }).exec((err, updated) => {
        if(err) return reject(err);
        resolve(updated[0])
      })
    })
  },

  findByTrackingCode: (trackingCode) => {
    return new Promise((resolve, reject) => {
      Payment.findOne({trackingCode: trackingCode}, (err, payment) => {
        if (err || !payment) return reject(sails.__('Your payment not found'))
        return resolve(payment)
      })
    })
  },

  zarinpalRequest: (user, amount) => {
    return new Promise((resolve, reject) =>
    {
      self.insertByUserId(user.id, amount, 'zarinpal').then(payment =>
      {
        const sandBox = (sails.config.params.zarinpal_sandbox === '1')
        const zarinpal = zarinpalCheckout.create(sails.config.params.zarinpal_merchant_id, sandBox)
        zarinpal.PaymentRequest({
          Amount: amount, // In Tomans
          CallbackURL: `${sails.config.params.callback_payment_url}/${payment.trackingCode}`,
          Description: 'افزایش لایک تلگرام',
          Email: sails.config.params.admin_email,
        }).then(response => {
          if (response.status === 100) {
            resolve({url: response.url, payment: payment})
          } else {
            reject({message: response.status})
          }
        }, err => {
          reject({message: err})
        })
      })
    })
  },

  zarinpalVerify: (trackingCode, authority, status) => {
    return new Promise((resolve, reject) =>
    {
      const redirectUrl = `https://t.me/${sails.config.params.bot_username}`

      if(trackingCode === '' || authority === '' || status === '') {
        return reject({url: redirectUrl, tgId: null})
      }

      self.findByTrackingCode(trackingCode).then(payment => {
        UserService.findById(payment.userId).then(user => {
          if(status !== 'OK') {
            self.update(payment.id, 0, status, '').then(paymentUpdated => {
              return reject({url: redirectUrl, tgId: user.tgId, message: sails.__('cancel payment by user')})
            })
          }
          else {
            const sandBox = (sails.config.params.zarinpal_sandbox === '1')
            const zarinpal = zarinpalCheckout.create(sails.config.params.zarinpal_merchant_id, sandBox)
            zarinpal.PaymentVerification({
          		Amount: payment.amount,
          		Authority: authority,
          	}).then(response => {
              self.update(payment.id, response.status, status, response.RefID).then(paymentUpdated =>
              {
                if (parseInt(response.status) === 100) {
                  OrderService.findByPaymentId(payment.id).then(order => {
                    OrderService.update(order.id, {status: 'working'}).then()
                    MessageService.addLike(order).then(res => {
                      sails.tgBot.sendMessage(user.tgId, 'به تعدادی که خواستی پستت رو لایک کردم 😍\nاگه نظری یا پیشنهادی داری با سازنده من تماس بگیر @javad010').then()
                    })
                    return resolve({url: redirectUrl, tgId: user.tgId, message: 'ممنون واست پرداخت، الان شروع میکنم به لایک پستت، تموم که شد خودم همینجا بهت پیام میدم\nاگه پست دیگه‌ای هم داری واسم فوروارد کن'})
                  })
                } else {
                  return reject({url: redirectUrl, tgId: user.tgId, message: sails.__('error payment')})
                }
              })
          	}, (err) => {
              self.update(payment.id, 0, err, '').then(paymentUpdated => {
                return reject({url: redirectUrl, tgId: user.tgId, message: sails.__('error payment')})
              })
            })
          }
        })
      }, () => {
        return reject({url: redirectUrl, tgId: null, message: sails.__('error payment')})
      })
    })
  },

  getManageList: (page=1, limit=5) => {
    return new Promise((resolve, reject) =>
    {
      const query = 'SELECT p.*, u.name as userFullName, u.tgUsername as username \
        FROM `payment` p \
        LEFT JOIN `user` u ON u.id = p.userId \
        WHERE p.status = "OK" \
        ORDER BY p.id DESC';

      User.query(`${query} LIMIT ? OFFSET ?`, [limit, (page-1)*limit], (err, rows) => {
        if (err || rows.length === 0) {
          return reject(sails.__('Payment not found'))
        }

        Post.query(`SELECT COUNT(*) AS count FROM (${query}) c`, [], (err, rowsCount) => {
          if (err || rowsCount.length === 0) return reject(sails.__('Payment not found'))
          resolve({rows: rows, count: rowsCount[0].count})
        })
      })
    })
  },

  manageList: (selfUser, page=1, limit=5) => {
    return new Promise((resolve, reject) =>
    {
      UserService.tgUpdateState(selfUser, 'manage_payment')
      self.getManageList(page, limit).then(data =>
      {
        let text = ''
        data.rows.forEach(payment => {
          text += `${persianJs(payment.amount.toString()).englishNumber().toString()} ${sails.__('Toman')}\n`
          text += `${sails.__('Refferer code')}: ${persianJs(payment.reffererCode.toString()).englishNumber().toString()}\n`

          if(payment.userFullName !== null) text += `${payment.userFullName}`
          if(payment.username !== null) text += ` [ @${payment.username} ]`

          text += `\n⌚️ ${persianJs(jMoment(payment.createdAt).fromNow()).englishNumber().toString()}\n\n`
        })

        let options = {}
        const inlineKeyboard = TextHelper.paginationInlineKeyboard(data.count, limit, 'manage_payment_page_', page)
        if(inlineKeyboard !== null) {
          options.reply_markup = {inline_keyboard: inlineKeyboard}
        }

        return resolve({text: text, options: options})
      }, (err) => {
        return reject({text: err})
      })
    })
  },

  changeAmount: (user, text) => {
    return new Promise((resolve, reject) =>
    {
      UserService.tgUpdateState(user, null)
      Setting.update({key: 'account_cost'}, {
        value: parseInt(text)
      }).exec((err, updated) => {
        if(err) return reject(err)

        sails.config.params.account_cost = parseInt(text)
        resolve({text: sails.__('Update cost')})
      })
    })
  }
}
