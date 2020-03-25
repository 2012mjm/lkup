const TextHelper = require("../../helper/TextHelper");
const moment = require("moment");
const persianJs = require("persianjs");
const jMoment = require("jalali-moment");
jMoment.loadPersian();

let self = (module.exports = {
  insertByUserId: (userId, attr) => {
    return new Promise((resolve, reject) => {
      Order.create({
        ...attr,
        userId,
        status: "pending",
        createdAt: moment().format("YYYY-MM-DD HH:mm:ss")
      }).exec((err, row) => {
        if (err) {
          return reject(err);
        }
        resolve(row);
      });
    });
  },

  insertByUserIdForChannel: (userId, channelUsername, count) => {
    return new Promise((resolve, reject) => {
      self
        .findPendingByChannelUsername(channelUsername)
        .then(() => {
          reject(sails.__("Channel is lock"));
        })
        .catch(() => {
          self
            .insertByUserId(userId, {
              channelUsername,
              count,
              type: "channel"
            })
            .then(resolve)
            .catch(() => reject(sails.__("Problem, try again")));
        });
    });
  },

  update: (id, updateAttr) => {
    return new Promise((resolve, reject) => {
      Order.update({ id: id }, updateAttr).exec((err, updated) => {
        if (err) return reject(err);
        resolve(updated[0]);
      });
    });
  },

  findById: id => {
    return new Promise((resolve, reject) => {
      Order.findOne({ id: id }, (err, model) => {
        if (err || !model) return reject(sails.__("Your post not found"));
        return resolve(model);
      });
    });
  },

  findByPaymentId: id => {
    return new Promise((resolve, reject) => {
      Order.findOne({ paymentId: id }, (err, model) => {
        if (err || !model) return reject(sails.__("not found"));
        return resolve(model);
      });
    });
  },

  findPendingByChannelUsername: channelUsername => {
    return new Promise((resolve, reject) => {
      Order.findOne({ channelUsername, status: "pending" }, (err, model) => {
        if (err || !model) return reject(sails.__("not found"));
        return resolve(model);
      });
    });
  },

  isUseFree: user => {
    return new Promise((resolve, reject) => {
      if (user.isAdmin) return reject();

      const query =
        "SELECT id FROM `order` \
                      WHERE userId = ? AND type = ? AND status != ?";

      Order.query(query, [user.id, "join", "pending"], (err, rows) => {
        if (err || rows.length === 0) {
          return reject(sails.__("not found"));
        }
        resolve(rows);
      });
    });
  }
});
