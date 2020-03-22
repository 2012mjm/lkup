module.exports = {
  tableName: 'like',
  autoCreatedAt: false,
  autoUpdatedAt: false,
  attributes: {
    userId: {
      type: 'integer',
      required: true,
      index: true,
      size: 11
    },
    messageId: {
      type: 'integer',
      required: true,
      index: true,
      size: 11
    },
    sessionId: {
      type: 'integer',
      required: true,
      index: true,
      size: 11
    },
    orderId: {
      type: 'integer',
      required: false,
      index: true,
      size: 11
    },
    status: {
      type: 'integer',
      required: false,
      size: 1
    },
    createdAt: {
      type: 'datetime',
      required: true
    }
  }
};
