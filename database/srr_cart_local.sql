-- =========================================================
-- SRR AND SUPPLY
-- MEMBER CART DATABASE
-- MySQL 8.x / HeidiSQL / Laragon
-- ต้องรัน srr_auth_local.sql ก่อน
-- =========================================================

CREATE DATABASE IF NOT EXISTS `srr_auth_local`
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE `srr_auth_local`;

-- =========================================================
-- CART
-- สมาชิก 1 คนมี active cart หลัก 1 ใบ
-- =========================================================

CREATE TABLE IF NOT EXISTS `Cart` (
  `id` VARCHAR(64) NOT NULL,
  `userId` VARCHAR(64) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE KEY `Cart_userId_key` (`userId`),

  CONSTRAINT `Cart_userId_fkey`
    FOREIGN KEY (`userId`)
    REFERENCES `User` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- CART ITEM
-- ข้อมูลสินค้าในช่วงนี้เป็น snapshot จากหน้าเว็บ
-- stockSnapshot ยังไม่ใช่ FlowAccount realtime stock
-- =========================================================

CREATE TABLE IF NOT EXISTS `CartItem` (
  `id` VARCHAR(64) NOT NULL,
  `cartId` VARCHAR(64) NOT NULL,
  `productId` INT NOT NULL,
  `productCode` VARCHAR(120) NOT NULL,
  `productName` VARCHAR(255) NOT NULL,
  `category` VARCHAR(120) NOT NULL DEFAULT '',
  `material` VARCHAR(120) NOT NULL DEFAULT '',
  `priceSnapshot` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `stockSnapshot` INT NOT NULL DEFAULT 0,
  `quantity` INT NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE KEY `CartItem_cartId_productId_key` (`cartId`, `productId`),
  KEY `CartItem_cartId_idx` (`cartId`),
  KEY `CartItem_productId_idx` (`productId`),

  CONSTRAINT `CartItem_cartId_fkey`
    FOREIGN KEY (`cartId`)
    REFERENCES `Cart` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- VERIFY
-- =========================================================

SHOW TABLES;
DESCRIBE `Cart`;
DESCRIBE `CartItem`;

SELECT COUNT(*) AS `totalCarts` FROM `Cart`;
SELECT COUNT(*) AS `totalCartItems` FROM `CartItem`;
