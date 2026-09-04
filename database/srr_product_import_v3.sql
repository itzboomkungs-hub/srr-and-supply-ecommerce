USE `srr_auth_local`;


CREATE TABLE IF NOT EXISTS `ProductCategory` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL,
  `code` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `status` ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `sortOrder` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ProductCategory_name_key` (`name`),
  UNIQUE KEY `ProductCategory_code_key` (`code`),
  KEY `ProductCategory_status_idx` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `ProductImportLog` (
  `id` VARCHAR(64) NOT NULL,
  `fileName` VARCHAR(255) NOT NULL,
  `duplicateMode` ENUM('SKIP','UPDATE') NOT NULL DEFAULT 'SKIP',
  `totalRows` INT NOT NULL DEFAULT 0,
  `createdProducts` INT NOT NULL DEFAULT 0,
  `updatedProducts` INT NOT NULL DEFAULT 0,
  `skippedRows` INT NOT NULL DEFAULT 0,
  `invalidRows` INT NOT NULL DEFAULT 0,
  `newCategories` INT NOT NULL DEFAULT 0,
  `createdByUserId` VARCHAR(64) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `ProductImportLog_createdAt_idx` (`createdAt`),
  KEY `ProductImportLog_createdByUserId_idx` (`createdByUserId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP PROCEDURE IF EXISTS `srr_add_import_v3_column`;
DELIMITER $$
CREATE PROCEDURE `srr_add_import_v3_column`(
  IN p_column VARCHAR(100),
  IN p_definition TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Product'
      AND COLUMN_NAME = p_column
  ) THEN
    SET @sql_text = CONCAT(
      'ALTER TABLE `Product` ADD COLUMN `', p_column, '` ', p_definition
    );
    PREPARE stmt FROM @sql_text;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$
DELIMITER ;


CALL `srr_add_import_v3_column`('sourceTgNo', 'VARCHAR(120) NULL');
CALL `srr_add_import_v3_column`('sourceSog', 'VARCHAR(120) NULL');
CALL `srr_add_import_v3_column`('sourceSogNp', 'VARCHAR(120) NULL');
CALL `srr_add_import_v3_column`('sourceCodeField', 'VARCHAR(30) NULL');
CALL `srr_add_import_v3_column`('sourceSheet', 'VARCHAR(120) NULL');
CALL `srr_add_import_v3_column`('sourceSize', 'VARCHAR(255) NULL');
CALL `srr_add_import_v3_column`('sourceMat', 'VARCHAR(120) NULL');
CALL `srr_add_import_v3_column`('sourcePrice', 'DECIMAL(15,4) NULL');
CALL `srr_add_import_v3_column`('sourceStock', 'DECIMAL(15,3) NULL');
CALL `srr_add_import_v3_column`('sourceItem', 'VARCHAR(120) NULL');
CALL `srr_add_import_v3_column`('sourceSizeMaterial', 'VARCHAR(255) NULL');
CALL `srr_add_import_v3_column`('importSource', 'VARCHAR(50) NULL');
CALL `srr_add_import_v3_column`('importedAt', 'DATETIME(3) NULL');
DROP PROCEDURE IF EXISTS `srr_add_import_v3_column`;


INSERT IGNORE INTO `ProductCategory`
(`name`, `code`, `description`, `status`, `sortOrder`)
SELECT DISTINCT
  TRIM(`category`),
  UPPER(TRIM(BOTH '-' FROM REPLACE(REPLACE(TRIM(`category`), ' ', '-'), '/', '-'))),
  CONCAT('หมวดหมู่จากสินค้าที่มีอยู่: ', TRIM(`category`)),
  'ACTIVE',
  500
FROM `Product`
WHERE TRIM(COALESCE(`category`, '')) <> '';


SELECT
  id, code, websiteName, category, material, sellPrice, stock,
  sourceTgNo, sourceSog, sourceSogNp, sourceCodeField, sourceSheet
FROM Product
ORDER BY id DESC
LIMIT 20;