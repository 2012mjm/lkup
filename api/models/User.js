module.exports = {
  tableName: 'user',
  autoCreatedAt: false,
  autoUpdatedAt: false,
  attributes: {
    name: {
      type: 'string',
      required: false,
      size: 45
    },
    tgId: {
      type: 'string',
      required: true,
      size: 45
    },
    tgUsername: {
      type: 'string',
      required: false,
      size: 128
    },
    tgState: {
      type: 'string',
      required: false,
      size: 128
    },
    tgStateParams: {
      type: 'text',
      required: false
    },
    createdAt: {
      type: 'datetime',
      required: true
    },
    isAdmin: {
      type: 'integer',
      required: true,
      size: 4
    }
  }
};
