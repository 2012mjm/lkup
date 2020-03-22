module.exports = {
  zarinpalVerify: (req, res) => {
    PaymentService.zarinpalVerify(req.params.trackingCode, req.query.Authority, req.query.Status).then(result => {
      sails.tgBot.sendMessage(result.tgId, result.message).then()
      return res.redirect(result.url)
    }, (error) => {
      if(error.tgId !== null) sails.tgBot.sendMessage(error.tgId, error.message).then()
      return res.redirect(error.url)
    })
  }
}
