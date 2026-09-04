USE `srr_auth_local`;


CREATE TABLE IF NOT EXISTS `Product` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(100) NOT NULL,
  `websiteName` VARCHAR(255) NOT NULL,
  `websiteDescription` TEXT NULL,
  `category` VARCHAR(150) NOT NULL DEFAULT '',
  `material` VARCHAR(150) NOT NULL DEFAULT '',
  `image` VARCHAR(500) NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `flowProductMasterId` BIGINT NULL,
  `flowName` VARCHAR(255) NULL,
  `flowCategoryName` VARCHAR(255) NULL,
  `flowType` INT NULL,
  `unitName` VARCHAR(100) NULL,
  `sellPrice` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `stock` DECIMAL(15,3) NOT NULL DEFAULT 0,
  `stockSource` VARCHAR(30) NOT NULL DEFAULT 'LOCAL',
  `lastSyncedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Product_code_key` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP PROCEDURE IF EXISTS `srr_add_product_column`;
DELIMITER $$
CREATE PROCEDURE `srr_add_product_column`(IN p_column VARCHAR(100), IN p_definition TEXT)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Product'
      AND COLUMN_NAME = p_column
  ) THEN
    SET @sql_text = CONCAT('ALTER TABLE `Product` ADD COLUMN `', p_column, '` ', p_definition);
    PREPARE stmt FROM @sql_text;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$
DELIMITER ;


CALL `srr_add_product_column`('websiteName', 'VARCHAR(255) NOT NULL DEFAULT ''''');
CALL `srr_add_product_column`('websiteDescription', 'TEXT NULL');
CALL `srr_add_product_column`('category', 'VARCHAR(150) NOT NULL DEFAULT ''''');
CALL `srr_add_product_column`('material', 'VARCHAR(150) NOT NULL DEFAULT ''''');
CALL `srr_add_product_column`('image', 'VARCHAR(500) NULL');
CALL `srr_add_product_column`('active', 'TINYINT(1) NOT NULL DEFAULT 1');
CALL `srr_add_product_column`('flowProductMasterId', 'BIGINT NULL');
CALL `srr_add_product_column`('flowName', 'VARCHAR(255) NULL');
CALL `srr_add_product_column`('flowCategoryName', 'VARCHAR(255) NULL');
CALL `srr_add_product_column`('flowType', 'INT NULL');
CALL `srr_add_product_column`('unitName', 'VARCHAR(100) NULL');
CALL `srr_add_product_column`('sellPrice', 'DECIMAL(15,2) NOT NULL DEFAULT 0');
CALL `srr_add_product_column`('stock', 'DECIMAL(15,3) NOT NULL DEFAULT 0');
CALL `srr_add_product_column`('stockSource', 'VARCHAR(30) NOT NULL DEFAULT ''LOCAL''');
CALL `srr_add_product_column`('productType', 'VARCHAR(30) NOT NULL DEFAULT ''STOCK''');
CALL `srr_add_product_column`('barcode', 'VARCHAR(150) NULL');
CALL `srr_add_product_column`('taxType', 'VARCHAR(30) NOT NULL DEFAULT ''EXCLUDE_VAT''');
CALL `srr_add_product_column`('lowStockThreshold', 'DECIMAL(15,3) NOT NULL DEFAULT 0');
CALL `srr_add_product_column`('incomeAccountCode', 'VARCHAR(50) NULL');
CALL `srr_add_product_column`('syncStatus', 'VARCHAR(30) NOT NULL DEFAULT ''LOCAL_ONLY''');
CALL `srr_add_product_column`('flowMatchedAt', 'DATETIME(3) NULL');
CALL `srr_add_product_column`('lastSyncedAt', 'DATETIME(3) NULL');
CALL `srr_add_product_column`('createdAt', 'DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)');
CALL `srr_add_product_column`('updatedAt', 'DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)');
DROP PROCEDURE IF EXISTS `srr_add_product_column`;


CREATE TABLE IF NOT EXISTS `ProductImage` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `productId` BIGINT NOT NULL,
  `imageUrl` VARCHAR(500) NOT NULL,
  `sortOrder` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `ProductImage_productId_idx` (`productId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DESCRIBE `Product`;
SELECT COUNT(*) AS totalProducts FROM `Product`;