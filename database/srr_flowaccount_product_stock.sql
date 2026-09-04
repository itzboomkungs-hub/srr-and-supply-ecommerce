-- =========================================================
-- SRR AND SUPPLY
-- FLOWACCOUNT + PRODUCT + STOCK
-- MySQL 8.x / HeidiSQL / Laragon
-- ใช้ฐานเดิม srr_auth_local
-- =========================================================

CREATE DATABASE IF NOT EXISTS `srr_auth_local`
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE `srr_auth_local`;

-- =========================================================
-- INTEGRATION SETTINGS
-- Secret / Token ต้องถูกเข้ารหัสจาก Next.js ก่อน INSERT/UPDATE
-- =========================================================

CREATE TABLE IF NOT EXISTS `IntegrationSetting` (
  `id` VARCHAR(64) NOT NULL,
  `provider` VARCHAR(50) NOT NULL,
  `environment` ENUM('SANDBOX','PRODUCTION') NOT NULL DEFAULT 'SANDBOX',
  `clientId` VARCHAR(255) NOT NULL DEFAULT '',
  `clientSecretEncrypted` TEXT NULL,
  `accessTokenEncrypted` TEXT NULL,
  `tokenExpiresAt` DATETIME(3) NULL,
  `syncProducts` TINYINT(1) NOT NULL DEFAULT 1,
  `syncPrices` TINYINT(1) NOT NULL DEFAULT 1,
  `syncStock` TINYINT(1) NOT NULL DEFAULT 1,
  `connectionStatus` ENUM('NOT_CONFIGURED','CONNECTED','ERROR') NOT NULL DEFAULT 'NOT_CONFIGURED',
  `lastError` TEXT NULL,
  `lastTestedAt` DATETIME(3) NULL,
  `lastSyncAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE KEY `IntegrationSetting_provider_key` (`provider`)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- PRODUCT
-- websiteName / websiteDescription / image / material / category
-- เป็นข้อมูลหน้าเว็บของ SRR
--
-- flow* เป็นข้อมูลที่มาจาก FlowAccount
-- stock / sellPrice จะถูก FlowAccount อัปเดตเมื่อเปิด sync toggle
-- =========================================================

CREATE TABLE IF NOT EXISTS `Product` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(120) NULL,

  `websiteName` VARCHAR(255) NOT NULL,
  `websiteDescription` TEXT NULL,
  `category` VARCHAR(120) NOT NULL DEFAULT '',
  `material` VARCHAR(120) NOT NULL DEFAULT '',
  `image` VARCHAR(500) NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,

  `flowProductMasterId` BIGINT NULL,
  `flowMainProductId` BIGINT NULL,
  `flowName` VARCHAR(255) NULL,
  `flowCategoryId` BIGINT NULL,
  `flowCategoryName` VARCHAR(255) NULL,
  `flowType` INT NULL,
  `unitName` VARCHAR(100) NULL,

  `sellPrice` DECIMAL(18,4) NOT NULL DEFAULT 0.0000,
  `flowSellPrice` DECIMAL(18,4) NULL,

  `stock` DECIMAL(18,4) NOT NULL DEFAULT 0.0000,
  `flowStock` DECIMAL(18,4) NULL,
  `stockSource` ENUM('LOCAL','FLOWACCOUNT') NOT NULL DEFAULT 'LOCAL',

  `lastSyncedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE KEY `Product_code_key` (`code`),
  UNIQUE KEY `Product_flowProductMasterId_key` (`flowProductMasterId`),
  KEY `Product_active_idx` (`active`),
  KEY `Product_category_idx` (`category`),
  KEY `Product_flowType_idx` (`flowType`)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- PRODUCT SYNC LOG
-- เก็บประวัติการ sync และ conflict/error โดยไม่เก็บ secret/token
-- =========================================================

CREATE TABLE IF NOT EXISTS `ProductSyncLog` (
  `id` VARCHAR(64) NOT NULL,
  `runId` VARCHAR(64) NOT NULL,
  `provider` VARCHAR(50) NOT NULL DEFAULT 'FLOWACCOUNT',
  `action` ENUM('CREATE','UPDATE','SKIP','CONFLICT','ERROR','SUMMARY') NOT NULL,
  `status` ENUM('SUCCESS','WARNING','ERROR') NOT NULL,
  `productId` INT NULL,
  `flowProductMasterId` BIGINT NULL,
  `productCode` VARCHAR(120) NULL,
  `message` VARCHAR(1000) NULL,
  `detailJson` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  KEY `ProductSyncLog_runId_idx` (`runId`),
  KEY `ProductSyncLog_productId_idx` (`productId`),
  KEY `ProductSyncLog_flowProductMasterId_idx` (`flowProductMasterId`),
  KEY `ProductSyncLog_createdAt_idx` (`createdAt`)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- DEFAULT FLOWACCOUNT ROW
-- =========================================================

INSERT INTO `IntegrationSetting` (
  `id`, `provider`, `environment`, `clientId`,
  `syncProducts`, `syncPrices`, `syncStock`, `connectionStatus`
)
VALUES (
  'flowaccount', 'FLOWACCOUNT', 'SANDBOX', '',
  1, 1, 1, 'NOT_CONFIGURED'
)
ON DUPLICATE KEY UPDATE
  `provider` = VALUES(`provider`);

-- =========================================================
-- MIGRATE CURRENT DEMO PRODUCTS INTO SQL
-- รักษา id 1-8 เดิม เพื่อ Cart เดิมยังจับสินค้าได้
-- ถ้ามี code อยู่แล้วจะไม่ทับชื่อหน้าเว็บเดิม
-- =========================================================

INSERT IGNORE INTO `Product`
(`id`,`code`,`websiteName`,`category`,`material`,`sellPrice`,`stock`,`stockSource`)
VALUES
(1,'OR-NBR-M70','O-Ring NBR M70','O-Ring','NBR',35.0000,820.0000,'LOCAL'),
(2,'OR-NBR-M60','O-Ring NBR M60','O-Ring','NBR',30.0000,650.0000,'LOCAL'),
(3,'OR-EPDM-M50','O-Ring EPDM M50','O-Ring','EPDM',42.0000,540.0000,'LOCAL'),
(4,'OR-VITON-M40','O-Ring Viton M40','O-Ring','Viton',65.0000,42.0000,'LOCAL'),
(5,'OR-SIL-M30','O-Ring Silicone M30','O-Ring','Silicone',55.0000,0.0000,'LOCAL'),
(6,'OR-NBR-M50','O-Ring NBR M50','O-Ring','NBR',32.0000,280.0000,'LOCAL'),
(7,'OS-NBR-35','Oil Seal NBR 35','Oil Seal','NBR',85.0000,125.0000,'LOCAL'),
(8,'OS-VITON-40','Oil Seal Viton 40','Oil Seal','Viton',120.0000,68.0000,'LOCAL');

-- =========================================================
-- VERIFY
-- =========================================================

SHOW TABLES;
DESCRIBE `IntegrationSetting`;
DESCRIBE `Product`;
DESCRIBE `ProductSyncLog`;

SELECT COUNT(*) AS `totalProducts` FROM `Product`;
SELECT `provider`, `environment`, `connectionStatus`, `syncProducts`, `syncPrices`, `syncStock`
FROM `IntegrationSetting`
WHERE `provider` = 'FLOWACCOUNT';
