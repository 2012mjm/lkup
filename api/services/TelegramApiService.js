const rp = require("request-promise");

let self = (module.exports = {
  getMessageFromChannel: (username, id) => {
    return new Promise((resolve, reject) => {
      rp({
        method: "GET",
        uri: `${sails.config.params.tg_api_url}/message`,
        qs: {
          channel_username: username,
          message_id: id
        },
        json: true
      })
        .then(json => {
          if (json.reply_markup === null) return reject();

          let newJson = [];
          json.reply_markup.forEach(arr => {
            let newInJson = [];
            arr.forEach(val => {
              if (val._ === "keyboardButtonCallback") {
                newInJson.push(val);
              }
            });
            if (newInJson.length > 0) newJson.push(newInJson);
          });

          if (newJson.length === 0) return reject();
          return resolve({
            json: json,
            replyMarkup: { inline_keyboard: newJson }
          });
        })
        .catch(err => {
          return reject(err);
        });
    });
  },

  clickOnButton: (session, username, id, callback_data) => {
    return new Promise((resolve, reject) => {
      rp({
        method: "POST",
        uri: `${sails.config.params.tg_api_url}/bot-callback`,
        formData: {
          session: session.phone,
          session_id: session.id,
          channel_username: username,
          message_id: id,
          callback_data: callback_data
        },
        json: true
      })
        .then(json => {
          return resolve(json);
        })
        .catch(err => {
          return reject(err);
        });
    });
  },

  sendCode: phone => {
    return new Promise((resolve, reject) => {
      rp({
        method: "POST",
        uri: `${sails.config.params.tg_api_auth_url}/user/login`,
        formData: {
          phone: phone
        },
        json: true
      })
        .then(json => {
          return resolve(json);
        })
        .catch(err => {
          return reject(err);
        });
    });
  },

  verifyCode: (phone, code, hash) => {
    return new Promise((resolve, reject) => {
      rp({
        method: "POST",
        uri: `${sails.config.params.tg_api_auth_url}/user/verify`,
        formData: {
          phone,
          code,
          hash
        },
        json: true
      })
        .then(json => {
          return resolve(json);
        })
        .catch(err => {
          return reject(err);
        });
    });
  }
});
