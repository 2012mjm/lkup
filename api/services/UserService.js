const moment = require('moment')
const TextHelper = require('../../helper/TextHelper')
const persianJs = require('persianjs')
const jMoment = require('jalali-moment')
jMoment.loadPersian()

let self = module.exports = {
  findById: (value) => {
    return new Promise((resolve, reject) => {
      User.findOne({id: value}, (err, user) => {
        if (err || !user) {
          return reject();
        }
        return resolve(user);
      });
    });
  },

  findByTgId: (value) => {
    return new Promise((resolve, reject) => {
      User.findOne({tgId: value}, (err, user) => {
        if (err || !user) {
          return reject();
        }
        return resolve(user);
      });
    });
  },

  getAllActiveAccount: () => {
    return new Promise((resolve, reject) =>
    {
      const query = 'SELECT * FROM `user` WHERE accountExpiryAt >= ? AND isAdmin = 0 ORDER BY accountExpiryAt ASC';
      User.query(query, [moment().format('YYYY-MM-DD HH:mm:ss')], (err, rows) => {
        if (err || rows.length === 0) {
          return reject(sails.__('User not found'))
        }
        resolve(rows)
      })
    })
  },

  getManageList: (page=1, limit=5) => {
    return new Promise((resolve, reject) =>
    {
      const query = 'SELECT * FROM `user` WHERE isAdmin = 0 ORDER BY id DESC';

      User.query(`${query} LIMIT ? OFFSET ?`, [limit, (page-1)*limit], (err, rows) => {
        if (err || rows.length === 0) {
          return reject(sails.__('User not found'))
        }

        Post.query(`SELECT COUNT(*) AS count FROM (${query}) c`, [], (err, rowsCount) => {
          if (err || rowsCount.length === 0) return reject(sails.__('User not found'))
          resolve({rows: rows, count: rowsCount[0].count})
        })
      })
    })
  },

  tgCreate: (attr) => {
    return new Promise((resolve, reject) => {
      User.create({
        tgId: attr.id,
        tgUsername: attr.username,
        name: `${attr.first_name}${(attr.last_name !== undefined && attr.last_name !== null) ? ' '+attr.last_name : ''}`,
        credit: 0,
        createdAt: moment().format('YYYY-MM-DD HH:mm:ss'),
        isAdmin: 0
      }).exec((err, user) => {
        if (err) {
          return reject(err)
        }

        if (user) {
          resolve(user)
        } else {
          reject(sails.__('Error in signup'))
        }
      })
    })
  },

  tgFindAndCreate: (attr) => {
    return new Promise((resolve, reject) =>
    {
      self.findByTgId(attr.id).then(user => {
        resolve(user)
      }, () => {
        self.tgCreate(attr).then(resolve, reject)
      })
    })
  },

  tgUpdateState: (user, newState, newParams) => {
    return new Promise((resolve, reject) =>
    {
      let updateAttr = {tgState: newState}
      if(newParams !== undefined && newParams === null) {
        updateAttr.tgStateParams = null
      }
      else if(newParams !== undefined && newParams !== null) {
        if(user.tgStateParams === null) {
          updateAttr.tgStateParams = JSON.stringify(newParams)
        }
        else {
          updateAttr.tgStateParams = JSON.parse(user.tgStateParams)
          Object.keys(newParams).forEach(key => {
            updateAttr.tgStateParams[key] = newParams[key]
          })
          updateAttr.tgStateParams = JSON.stringify(updateAttr.tgStateParams)
        }
      }

      User.update({id: user.id}, updateAttr).exec((err, updated) => {
        if(err) return reject(err);
        resolve(updated[0]);
      });
    })
  },

  accountActiveList: () => {
    return new Promise((resolve, reject) =>
    {
      const query = 'SELECT * FROM `user` \
        WHERE isAdmin = 0 AND accountExpiryAt >= ? \
        ORDER BY id DESC';

      User.query(query, [moment().format('YYYY-MM-DD HH:mm:ss')], (err, rows) => {
        if (err || rows.length === 0) {
          return reject(sails.__('User not found'))
        }
        resolve(rows);
      })
    })
  },

  broadcastList: () => {
    return new Promise((resolve, reject) =>
    {
      let broadcast = []
      self.accountActiveList().then(users => {
        users.forEach(user => {
          broadcast.push(user.tgId)
        })
        resolve(broadcast)
      }, reject)
    })
  },

  isActiveAccount: (user) => {
    return new Promise((resolve, reject) =>
    {
      if(moment().isBefore(user.accountExpiryAt) || user.isAdmin) {
        return resolve()
      }

      PaymentService.zarinpalRequest(user, sails.config.params.account_cost).then(zarinpal =>
      {
        return reject({text: sails.__('Your account is expired'), options: {reply_markup: {inline_keyboard: [[{
          text: `${sails.__('charge account')} ${TextHelper.price(sails.config.params.account_cost)}`,
          url: zarinpal.url
        }]]}}})
      }, () => {
        return reject({text: sails.__('Problem, try again')})
      })
    })
  },

  manageList: (selfUser, page=1, limit=5) => {
    return new Promise((resolve, reject) =>
    {
      UserService.tgUpdateState(selfUser, 'manage_users')
      self.getManageList(page, limit).then(data =>
      {
        let text = ''
        data.rows.forEach(user => {
          text += `${persianJs(user.id.toString()).englishNumber().toString()}`
          if(user.name !== null) text += ` - ${user.name}`
          if(user.tgUsername !== null) text += ` [ @${user.tgUsername} ]`
          text += `\n⌚️ ${persianJs(jMoment(user.createdAt).fromNow()).englishNumber().toString()}\n`

          if(moment().isBefore(user.accountExpiryAt)) {
            text += `${sails.__('Expiry')} ${persianJs(jMoment(user.accountExpiryAt).fromNow()).englishNumber().toString()} ${sails.__('Other')}\n`
          } else if(user.accountExpiryAt !== null) {
            text += `${sails.__('Fail expiry')}\n`
          } else {
            text += `${sails.__('Guest')}\n`
          }

          text += '\n'
        })

        let options = {}
        const inlineKeyboard = TextHelper.paginationInlineKeyboard(data.count, limit, 'manage_user_page_', page)
        if(inlineKeyboard !== null) {
          options.reply_markup = {inline_keyboard: inlineKeyboard}
        }

        return resolve({text: text, options: options})
      }, (err) => {
        return reject({text: err})
      })
    })
  },

  accountRenewal: (user) => {
    return new Promise((resolve, reject) =>
    {
      let accountExpiryAt = moment().add(30, 'days')
      if(user.accountExpiryAt !== null && moment().isBefore(user.accountExpiryAt)) {
        accountExpiryAt = moment(user.accountExpiryAt).add(30, 'days')
      }

      User.update({id: user.id}, {accountExpiryAt: accountExpiryAt.format('YYYY-MM-DD HH:mm:ss')}).exec((err, updated) => {
        if(err) return reject(err)
        resolve(updated[0])
      })
    })
  },

  rememberCronJob: () => {
    return new Promise((resolve, reject) =>
    {
      self.getAllActiveAccount().then(users => {
        users.forEach(user => {
          if(moment(user.accountExpiryAt).format('YYYY-MM-DD') === moment().add(1, 'days').format('YYYY-MM-DD')) {
            self.rememberMessage(user, `${sails.__('one')} ${sails.__('remember expiry account')}`)
          }
          else if(moment(user.accountExpiryAt).format('YYYY-MM-DD') === moment().add(3, 'days').format('YYYY-MM-DD')) {
            self.rememberMessage(user, `${sails.__('three')} ${sails.__('remember expiry account')}`)
          }
        })
      })
    })
  },

  rememberMessage: (user, message) => {
    return new Promise((resolve, reject) =>
    {
      PaymentService.zarinpalRequest(user, sails.config.params.account_cost).then(zarinpal =>
      {
        sails.tgBot.sendMessage(user.tgId, message, {reply_markup: {inline_keyboard: [[{
          text: `${sails.__('charge account')} ${TextHelper.price(sails.config.params.account_cost)}`,
          url: zarinpal.url
        }]]}}).then(resolve, reject)
      }, reject)
    })
  }
}
