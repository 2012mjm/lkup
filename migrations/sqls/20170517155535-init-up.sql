SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;

-- -----------------------------------------------------
-- Table `session`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `session` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `phone` VARCHAR(45) CHARACTER SET 'utf8mb4' NOT NULL,
  `blockDate` DATETIME NULL DEFAULT NULL,
  `firstname` VARCHAR(45) NULL,
  `lastname` VARCHAR(45) NULL,
  `gender` VARCHAR(20) NULL,
  `blockJoinChannel` TINYINT(1) NOT NULL DEFAULT '0',
  `active` tinyint(1) NOT NULL DEFAULT '1',
   PRIMARY KEY (`id`),
   UNIQUE KEY `phone` (`phone`)
)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;

-- -----------------------------------------------------
-- Table `user`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `user` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) CHARACTER SET 'utf8mb4' NULL,
  `tgId` VARCHAR(45) NOT NULL,
  `tgUsername` VARCHAR(128) NULL,
  `tgState` VARCHAR(128) NULL,
  `tgStateParams` TEXT NULL,
  `createdAt` DATETIME NOT NULL,
  `isAdmin` TINYINT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `message`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `message` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `tgId` INT NOT NULL,
  `channelId` VARCHAR(45) NOT NULL,
  `channelUsername` VARCHAR(128) NOT NULL,
  `countLike` INT NOT NULL DEFAULT 0,
  `readSessionId` INT NULL,
  `replyMarkup` TEXT NULL,
  `viaBotId` VARCHAR(45) NULL,
  `createdAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_like_channel_session1_idx` (`readSessionId` ASC),
  INDEX `fk_like_channel_user1_idx` (`userId` ASC),
  CONSTRAINT `fk_like_channel_session1`
    FOREIGN KEY (`readSessionId`)
    REFERENCES `session` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_like_channel_user1`
    FOREIGN KEY (`userId`)
    REFERENCES `user` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

ALTER TABLE `message` ADD `button` TEXT NULL AFTER `countLike`;


-- -----------------------------------------------------
-- Table `payment`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `payment` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `gateway` ENUM('zarinpal') NOT NULL DEFAULT 'zarinpal',
  `amount` BIGINT(20) NOT NULL,
  `trackingCode` VARCHAR(45) NULL,
  `reffererCode` VARCHAR(45) NULL,
  `statusCode` INT NULL,
  `status` VARCHAR(128) NULL,
  `createdAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_payment_user1_idx` (`userId` ASC),
  CONSTRAINT `fk_payment_user1`
    FOREIGN KEY (`userId`)
    REFERENCES `user` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `order`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `order` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `messageId` INT NOT NULL,
  `countLike` INT NOT NULL DEFAULT 0,
  `type` ENUM('join', 'coin') NOT NULL,
  `paymentId` INT NULL,
  `status` ENUM('pending', 'working', 'done') NOT NULL DEFAULT 'pending',
  `createdAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_like_order_user1_idx` (`userId` ASC),
  INDEX `fk_like_order_like_channel1_idx` (`messageId` ASC),
  INDEX `fk_like_order_payment1_idx` (`paymentId` ASC),
  CONSTRAINT `fk_like_order_user1`
    FOREIGN KEY (`userId`)
    REFERENCES `user` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_like_order_like_channel1`
    FOREIGN KEY (`messageId`)
    REFERENCES `message` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_like_order_payment1`
    FOREIGN KEY (`paymentId`)
    REFERENCES `payment` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `like`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `like` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `messageId` INT NOT NULL,
  `sessionId` INT NOT NULL,
  `orderId` INT NULL,
  `status` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_like_session_user1_idx` (`userId` ASC),
  INDEX `fk_like_session_like_channel1_idx` (`messageId` ASC),
  INDEX `fk_like_session_session1_idx` (`sessionId` ASC),
  INDEX `fk_like_session_like_order1_idx` (`orderId` ASC),
  CONSTRAINT `fk_like_session_user1`
    FOREIGN KEY (`userId`)
    REFERENCES `user` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_like_session_like_channel1`
    FOREIGN KEY (`messageId`)
    REFERENCES `message` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_like_session_session1`
    FOREIGN KEY (`sessionId`)
    REFERENCES `session` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_like_session_like_order1`
    FOREIGN KEY (`orderId`)
    REFERENCES `order` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

ALTER TABLE `like` CHANGE `status` `status` TINYINT(1) NULL;

-- -----------------------------------------------------
-- Table `setting`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `setting` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(45) NULL,
  `key` VARCHAR(45) NOT NULL,
  `value` TEXT NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;

INSERT INTO `setting` (`id`, `title`, `key`, `value`) VALUES
  (NULL, 'شناسه بات', 'bot_username', 'likesup_bot'),
  (NULL, 'توکن بات', 'bot_token', '590356167:AAFGI8Oj8K6brBtbwVik9bhMzWWHgJ1K890'),
  (NULL, 'آی دی کانال', 'channel_username', '...'),
  (NULL, 'آی دی مدیر', 'manager_telegram_id', '114463063'),
  (NULL, 'مرچنت زرین پال', 'zarinpal_merchant_id', '9a58e0b4-a11f-11e7-969d-000c295eb8fc'),
  (NULL, 'وضعیت سندباکس زرین پال', 'zarinpal_sandbox', '0'),
  (NULL, 'آدرس بازگشتی درگاه پرداخت', 'callback_payment_url', 'http://127.0.0.1:5834/zarinpal-verify'),
  (NULL, 'ایمیل مدیر', 'admin_email', 'info@127.0.0.1'),
  (NULL, 'آدرس وب سرویس تلگرام', 'tg_api_url', 'http://127.0.0.1:5833'),
  (NULL, 'آدرس وب سرویس احراز هویت تلگرام', 'tg_api_auth_url', 'http://127.0.0.1:5833'),
  (NULL, '۵ لایک رایگان', 'price_like_5', '0'),
  (NULL, '۱۰ لایک', 'price_like_30', '3000'),
  (NULL, '۱۲۰ لایک', 'price_like_120', '8500'),
  (NULL, '۵۰ لایک', 'price_like_50', '4000'),
  (NULL, '۱ لایک تست درگاه پرداخت', 'price_like_1', '100'),
  (NULL, '۵۰۰ لایک رایگان مدیر', 'price_like_500', '0'),
  (NULL, '۱۰۰ لایک', 'price_like_100', '7500');

SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
