/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.bootstrap.html
 */

module.exports.bootstrap = function(cb) {
  SettingService.getAll().then(
    rows => {
      rows.map(row => {
        sails.config.params[row.key] = row.value;
      });

      sails.tgBot = new TelegramBotService(sails.config.params.bot_token, true);

      sails.tgBot.bot.on("message", async ctx => {
        try {
          sails.tgBot.setContext(ctx);

          sails.tgBot.messageEvent();
        } catch (e) {
          console.log("telegram bot", e);
        }
      });

      sails.tgBot.bot.on("callback_query", async ctx => {
        try {
          sails.tgBot.setContextCallbackQuery(ctx);

          sails.tgBot.callbackQueryEvent();
        } catch (e) {
          console.log("telegram bot", e);
        }
      });

      sails.tgBot.bot.launch();

      // sails.tgBot.on("message", msg => {
      //   console.log("msg", msg);
      //   TelegramBotService.messageEvent(msg);
      // });
      // sails.tgBot.on("callback_query", callbackQuery => {
      //   TelegramBotService.callbackQueryEvent(callbackQuery);
      // });
      // sails.tgBot.on("inline_query", inlineQuery => {
      //   TelegramBotService.inlineQueryEvent(inlineQuery);
      // });

      cb();
    },
    err => {
      cb();
    }
  );
};
