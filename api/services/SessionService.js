const TextHelper = require("../../helper/TextHelper");
const boys = require("../../helper/boys");
const girls = require("../../helper/girls");
const bios = require("../../helper/bios");
const jMoment = require("jalali-moment");
jMoment.loadPersian();

let self = (module.exports = {
  getNotUse: (messageId, count) => {
    return new Promise((resolve, reject) => {
      const query =
        "SELECT id, phone FROM `session` `s` \
                      WHERE NOT EXISTS (SELECT * FROM `like` `l` \
					              WHERE l.sessionId = s.id AND l.messageId = ?) \
                        AND active = 1 \
                        ORDER BY id \
                        LIMIT ?";

      Session.query(query, [messageId, count], (err, rows) => {
        if (err || rows.length === 0) {
          return reject(sails.__("not found"));
        }
        resolve(rows);
      });
    });
  },

  insert: (phone, firstname, lastname, gender) => {
    return new Promise((resolve, reject) => {
      Session.create({
        phone,
        firstname,
        lastname,
        gender,
        blockJoinChannel: "0",
        active: "1"
      }).exec((err, row) => {
        if (err) {
          return reject(err);
        }
        resolve(row);
      });
    });
  },

  findByPhone: phone => {
    return new Promise((resolve, reject) => {
      Session.findOne({ phone: phone }, (err, model) => {
        if (err || !model) return reject(sails.__("Your session not found"));
        return resolve(model);
      });
    });
  },

  addNewNumber: phone => {
    return new Promise((resolve, reject) => {
      self.findByPhone(phone).then(
        res => {
          return reject("این شماره در سیستم وجود دارد!");
        },
        err => {
          TelegramApiService.sendCode(phone).then(
            res => {
              if (res.status === "send_code") {
                return resolve({
                  message:
                    "کد تایید برای شما ارسال شد\nکد را برای من ارسال کنید.",
                  hash: res.result
                });
              } else if (res.status === "already_login") {
                return reject(
                  `این شماره در سیستم وجود دارد! به نام: ${res.result.first_name}`
                );
              } else if (res.status === "floodWaitError") {
                return reject(
                  `فعال سازی این شماره تا تاریخ ${res.result} مسدود شده است`
                );
              } else {
                return reject(
                  `خطایی رخ داده است دوباره تلاش کنید!\nوضعیت خطا: ${res.status}`
                );
              }
            },
            err => {
              return reject(`خطایی رخ داده است دوباره تلاش کنید!`);
            }
          );
        }
      );
    });
  },

  verifyNewNumber: (phone, code, hash) => {
    return new Promise((resolve, reject) => {
      const { firstname, lastname, gender } = TextHelper.nameGenerator();

      const bioIndex = Math.floor(Math.random() * bios.length);
      bio = bios[bioIndex];

      let photo;
      if (gender === "male") {
        const index = Math.floor(Math.random() * boys.length);
        photo = boys[index];
      } else {
        const index = Math.floor(Math.random() * girls.length);
        photo = girls[index];
      }

      TelegramApiService.verifyCode(
        phone,
        code,
        hash,
        firstname,
        lastname,
        bio,
        photo
      ).then(
        res => {
          if (res.status === "ok") {
            self.insert(phone, firstname, lastname, gender).then(
              res => {
                return resolve("شماره مورد نظر با موفقیت افزوده شد.");
              },
              err => {
                return reject(`خطایی رخ داده است با تیم پشتیبانی تماس بگیرید.`);
              }
            );
          } else if (res.status === "floodWaitError") {
            return reject(
              `فعال سازی این شماره تا تاریخ ${res.result} مسدود شده است`
            );
          } else {
            return reject(
              `خطایی رخ داده است دوباره تلاش کنید!\nوضعیت خطا: ${res.status}`
            );
          }
        },
        err => {
          return reject(`خطایی رخ داده است دوباره تلاش کنید!`);
        }
      );
    });
  }
});
