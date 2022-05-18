CREATE TABLE IF NOT EXISTS `supinic.com`.`Session` (
	`SID` VARCHAR(128) NOT NULL COLLATE 'utf8mb4_general_ci',
	`Expires` INT(11) UNSIGNED NOT NULL,
	`Data` MEDIUMTEXT NULL DEFAULT NULL COLLATE 'utf8mb4_general_ci',
	PRIMARY KEY (`SID`) USING BTREE
)
COLLATE='utf8mb4_general_ci'
ENGINE=InnoDB
;