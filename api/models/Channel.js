module.exports = {
  tableName: "channel",
  autoCreatedAt: false,
  autoUpdatedAt: false,
  attributes: {
    userId: {
      type: "integer",
      required: true,
      index: true,
      size: 11
    },
    channelUsername: {
      type: "string",
      required: true,
      size: 128
    },
    sessionId: {
      type: "integer",
      required: true,
      index: true,
      size: 11
    },
    orderId: {
      type: "integer",
      required: false,
      index: true,
      size: 11
    },
    status: {
      type: "integer",
      required: false,
      size: 1
    },
    createdAt: {
      type: "datetime",
      required: true
    }
  }
};
