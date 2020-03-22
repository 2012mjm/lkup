module.exports = {
  tableName: 'message',
  autoCreatedAt: false,
  autoUpdatedAt: false,
  attributes: {
    userId: {
      type: 'integer',
      required: true,
      index: true,
      size: 11
    },
    tgId: {
      type: 'integer',
      required: true,
      size: 11
    },
    channelId: {
      type: 'string',
      required: true,
      size: 45
    },
    channelUsername: {
      type: 'string',
      required: true,
      size: 128
    },
    countLike: {
      type: 'integer',
      required: true,
      size: 11
    },
    button: {
      type: 'text',
      required: false
    },
    readSessionId: {
      type: 'integer',
      required: false,
      index: true,
      size: 11
    },
    replyMarkup: {
      type: 'text',
      required: false
    },
    viaBotId: {
      type: 'string',
      required: false,
      size: 45
    },
    createdAt: {
      type: 'datetime',
      required: true
    }
  }
};
