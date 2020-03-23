module.exports = {
  tableName: "session",
  autoCreatedAt: false,
  autoUpdatedAt: false,
  attributes: {
    phone: {
      type: "string",
      required: true,
      size: 45
    },
    blockDate: {
      type: "datetime",
      required: false
    },
    firstname: {
      type: "string",
      required: false,
      size: 45
    },
    lastname: {
      type: "string",
      required: false,
      size: 45
    },
    gender: {
      type: "string",
      required: false,
      size: 20
    },
    blockJoinChannel: {
      type: "integer",
      required: false
    },
    active: {
      type: "integer",
      required: false
    }
  }
};
