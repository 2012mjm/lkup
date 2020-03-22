module.exports = {
  tableName: 'payment',
  autoCreatedAt: false,
  autoUpdatedAt: false,
  attributes: {
    userId: {
      type: 'integer',
      required: true,
      index: true,
      size: 11
    },
    gateway: {
      type: 'string',
      required: true,
      enum: ['zarinpal']
    },
    amount: {
      type: 'integer',
      required: true,
      size: 20
    },
    trackingCode: {
      type: 'string',
      required: false,
      size: 45
    },
    reffererCode: {
      type: 'string',
      required: false,
      size: 45
    },
    statusCode: {
      type: 'integer',
      required: false,
      size: 11
    },
    status: {
      type: 'string',
      required: false,
      size: 128
    },
    createdAt: {
      type: 'datetime',
      required: true
    }
  }
};
