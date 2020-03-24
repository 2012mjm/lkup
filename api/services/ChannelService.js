const moment = require("moment");

let self = (module.exports = {
  insertByUserId: (userId, attr) => {
    return new Promise((resolve, reject) => {
      Channel.create({
        ...attr,
        userId,
        status: attr.status ? 1 : 0,
        createdAt: moment().format("YYYY-MM-DD HH:mm:ss")
      }).exec((err, row) => {
        if (err) {
          return reject(err);
        }
        resolve(row);
      });
    });
  },

  updateStatus: (id, status) => {
    return new Promise((resolve, reject) => {
      Channel.update(
        { id },
        { status: status ? 1 : 0 }
      ).exec((err, updated) => {
        if (err) return reject(err);
        resolve(updated[0]);
      });
    });
  },

  joinMember: order => {
    return new Promise((resolve, reject) => {
      let c = 0;
      SessionService.getNotUseJoinChannel(order.channelUsername, order.count)
        .then(sessions => {
          sessions.forEach(session => {
            TelegramApiService.joinToChannel(
              session.phone,
              order.channelUsername
            ).then(
              res => {
                c++;
                self
                  .insertByUserId(order.userId, {
                    channelUsername: order.channelUsername,
                    sessionId: session.id,
                    orderId: order.id,
                    status: true
                  })
                  .then();
                if (c >= order.count) {
                  OrderService.update(order.id, { status: "done" }).then();
                  return resolve();
                }
              },
              err => {
                if (err.status === "ChannelsTooMuchError") {
                  SessionService.update(session.id, { blockJoinChannel: "1" });
                } else if (
                  err.status === "ChannelInvalidError" ||
                  err.status === "ChannelPrivateError"
                ) {
                  return reject(err.result);
                }

                self
                  .insertByUserId(order.userId, {
                    channelUsername: order.channelUsername,
                    sessionId: session.id,
                    orderId: order.id,
                    status: false
                  })
                  .then();
              }
            );
          });
        })
        .catch(() => reject(sails.__("Problem, try again")));
    });
  }
});
