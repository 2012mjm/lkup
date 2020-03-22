module.exports = {
  tableName: 'session',
  autoCreatedAt: false,
  autoUpdatedAt: false,
  attributes: {
    phone: {
      type: 'string',
      required: true,
      size: 45
    },
    blockDate: {
      type: 'datetime',
      required: false
    },
    active: {
      type: 'integer',
      required: false
    }
  }
};
