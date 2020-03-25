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
      let countDone = 0;
      SessionService.getNotUseJoinChannel(
        order.channelUsername,
        order.count + 500
      )
        .then(async sessions => {
          for (let i = 0; i < sessions.length; i++) {
            const session = sessions[i];

            if (countDone >= order.count) {
              OrderService.update(order.id, { status: "done" }).then();
              return resolve();
            }

            try {
              await TelegramApiService.joinToChannel(
                session.phone,
                order.channelUsername
              );

              countDone++;
              self
                .insertByUserId(order.userId, {
                  channelUsername: order.channelUsername,
                  sessionId: session.id,
                  orderId: order.id,
                  status: true
                })
                .then();
            } catch (err) {
              if (err.status === "ChannelsTooMuchError") {
                SessionService.update(session.id, { blockJoinChannel: "1" });
              } else if (
                i === 0 &&
                (err.status === "ChannelInvalidError" ||
                  err.status === "ChannelPrivateError")
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
          }

          OrderService.update(order.id, { status: "done" }).then();
          return resolve();
        })
        .catch(() => reject(sails.__("Problem, try again")));
    });
  }
});
