module.exports = {
  tableName: 'setting',
  autoCreatedAt: false,
  autoUpdatedAt: false,
  attributes: {
    title: {
      type: 'string',
      required: false,
      size: 45
    },
    key: {
      type: 'string',
      required: true,
      size: 45
    },
    value: {
      type: 'text',
      required: true
    }
  }
};
