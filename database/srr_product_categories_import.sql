USE `srr_auth_local`;


CREATE TABLE IF NOT EXISTS `ProductCategory` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL,
  `code` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `status` ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `sortOrder` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ProductCategory_name_key` (`name`),
  UNIQUE KEY `ProductCategory_code_key` (`code`),
  KEY `ProductCategory_status_idx` (`status`),
  KEY `ProductCategory_sort_idx` (`sortOrder`, `name`)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


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
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


DROP PROCEDURE IF EXISTS `srr_add_product_import_column`;
DELIMITER $$
CREATE PROCEDURE `srr_add_product_import_column`(
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
      'ALTER TABLE `Product` ADD COLUMN `',
      p_column,
      '` ',
      p_definition
    );
    PREPARE stmt FROM @sql_text;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$
DELIMITER ;


CALL `srr_add_product_import_column`('sourceItem', 'VARCHAR(120) NULL');
CALL `srr_add_product_import_column`('sourceSizeMaterial', 'VARCHAR(255) NULL');
CALL `srr_add_product_import_column`('importSource', 'VARCHAR(50) NULL');
CALL `srr_add_product_import_column`('importedAt', 'DATETIME(3) NULL');
DROP PROCEDURE IF EXISTS `srr_add_product_import_column`;


INSERT IGNORE INTO `ProductCategory`
(`name`,`code`,`description`,`status`,`sortOrder`)
VALUES
('O-Ring','O-RING','ซีลยางโอริงสำหรับงานอุตสาหกรรม','ACTIVE',10),
('Oil Seal','OIL-SEAL','ซีลน้ำมันสำหรับเครื่องจักร','ACTIVE',20),
('Mechanical Seal','MECH-SEAL','ซีลสำหรับระบบปั๊มและเครื่องจักร','ACTIVE',30),
('Bearing','BEARING','ตลับลูกปืนและอุปกรณ์ที่เกี่ยวข้อง','ACTIVE',40),
('อะไหล่อื่นๆ','OTHER','สินค้าและอะไหล่ประเภทอื่น','INACTIVE',999);


INSERT IGNORE INTO `ProductCategory`
(`name`,`code`,`description`,`status`,`sortOrder`)
SELECT DISTINCT
  TRIM(`category`) AS `name`,
  UPPER(
    TRIM(BOTH '-' FROM
      REPLACE(
        REPLACE(
          REPLACE(TRIM(`category`), ' ', '-'),
          '/', '-'
        ),
        '--', '-'
      )
    )
  ) AS `code`,
  CONCAT('หมวดหมู่จากสินค้าที่มีอยู่: ', TRIM(`category`)),
  'ACTIVE',
  500
FROM `Product`
WHERE TRIM(COALESCE(`category`, '')) <> '';


SELECT
  c.id,
  c.name,
  c.code,
  c.status,
  COUNT(p.id) AS productCount
FROM ProductCategory c
LEFT JOIN Product p ON p.category = c.name
GROUP BY c.id, c.name, c.code, c.status
ORDER BY c.sortOrder, c.name;