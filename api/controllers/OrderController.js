module.exports = {
  run: (req, res) => {
    OrderService.findById(req.query.id).then(order => {
      UserService.findById(order.userId).then(user => {
        OrderService.update(order.id, {status: 'working'}).then()
        MessageService.addLike(order).then(res => {
          if(req.query.alert === '1') sails.tgBot.sendMessage(user.tgId, 'به تعدادی که خواستی پستت رو لایک کردم 😍\nاگه نظری یا پیشنهادی داری با سازنده من تماس بگیر @javad010').then()
        })
        if(req.query.alert === '1') sails.tgBot.sendMessage(user.tgId, 'ممنون واست پرداخت، الان شروع میکنم به لایک پستت، تموم که شد خودم همینجا بهت پیام میدم\nاگه پست دیگه‌ای هم داری واسم فوروارد کن').then()
      })
      return res.redirect('http://t.me/likesup_bot')
    })
  }
}
