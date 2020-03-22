module.exports = {
  tableName: 'order',
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
    countLike: {
      type: 'integer',
      required: true,
      size: 11
    },
    type: {
      type: 'string',
      required: true,
      enum: ['join', 'coin']
    },
    paymentId: {
      type: 'integer',
      required: false,
      index: true,
      size: 11
    },
    status: {
      type: 'string',
      required: true,
      enum: ['pending', 'working', 'done']
    },
    createdAt: {
      type: 'datetime',
      required: true
    }
  }
};
