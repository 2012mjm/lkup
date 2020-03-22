var self = module.exports = {

  getAll: () => {
    return new Promise((resolve, reject) =>
    {
      Setting.find().exec((err, rows) => {
        if (err) return reject(err)
        return resolve(rows)
      });
    });
  },

  updateByKey: (key, value) => {
    return new Promise((resolve, reject) =>
    {
      Setting.update({key: key}, {value: value}).exec((err, updated) => {
        if(err) return reject(err);
        resolve(updated[0]);
      });
    });
  },
}
