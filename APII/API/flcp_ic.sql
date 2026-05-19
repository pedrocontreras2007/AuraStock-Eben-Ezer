-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: flcp_ic
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `harvests`
--

DROP TABLE IF EXISTS `harvests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `harvests` (
  `id` char(36) NOT NULL,
  `crop` varchar(80) NOT NULL,
  `category` enum('primera','segunda','tercera') NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 0,
  `date` datetime NOT NULL,
  `recorded_by` varchar(40) DEFAULT NULL,
  `recorded_by_partner_name` varchar(120) DEFAULT NULL,
  `recorded_by_user` varchar(120) DEFAULT NULL,
  `purchase_price_clp` int(11) DEFAULT NULL,
  `sale_price_clp` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_harvests_date` (`date`),
  KEY `idx_harvests_crop` (`crop`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `harvests`
--

LOCK TABLES `harvests` WRITE;
/*!40000 ALTER TABLE `harvests` DISABLE KEYS */;
INSERT INTO `harvests` VALUES ('a100-0001','Rosa Roja','primera',320,'2025-10-12 08:30:00','socio','María González','innovacode1857@gmail.com',800,1500,'2026-03-31 01:58:04','2026-03-31 01:58:04'),('a100-0002','Clavel Blanco','segunda',180,'2025-10-28 09:15:00','socio','Juan Pérez','innovacode1857@gmail.com',500,900,'2026-03-31 01:58:04','2026-03-31 01:58:04'),('a100-0003','Girasol','primera',260,'2025-11-05 07:45:00','socio','Carlos Rojas','innovacode1857@gmail.com',400,750,'2026-03-31 01:58:04','2026-03-31 01:58:04'),('a100-0004','Rosa Amarilla','primera',290,'2025-11-20 10:00:00','socio','María González','innovacode1857@gmail.com',850,1600,'2026-03-31 01:58:04','2026-03-31 01:58:04'),('a100-0005','Lavanda','primera',430,'2025-12-03 08:00:00','socio','Fran','innovacode1857@gmail.com',1000,1900,'2026-03-31 01:58:04','2026-03-31 01:58:04'),('a100-0006','Clavel Rojo','segunda',160,'2025-12-18 09:30:00','socio','Juan Pérez','innovacode1857@gmail.com',500,850,'2026-03-31 01:58:04','2026-03-31 01:58:04'),('a100-0007','Rosa Roja','primera',380,'2026-01-08 08:15:00','socio','María González','innovacode1857@gmail.com',800,1550,'2026-03-31 01:58:04','2026-03-31 01:58:04'),('a100-0008','Tulipán','primera',200,'2026-01-22 10:30:00','socio','Ana Fuentes','innovacode1857@gmail.com',1200,2200,'2026-03-31 01:58:04','2026-03-31 01:58:04'),('a100-0009','Crisantemo','segunda',175,'2026-02-10 07:30:00','socio','Carlos Rojas','innovacode1857@gmail.com',600,1100,'2026-03-31 01:58:04','2026-03-31 01:58:04'),('a100-0010','Girasol','segunda',310,'2026-02-25 09:00:00','socio','Carlos Rojas','innovacode1857@gmail.com',400,700,'2026-03-31 01:58:04','2026-03-31 01:58:04'),('a100-0011','Rosa Roja','primera',420,'2026-03-05 08:00:00','socio','María González','innovacode1857@gmail.com',800,1500,'2026-03-31 01:58:04','2026-03-31 01:58:04'),('a100-0012','Clavel Blanco','primera',240,'2026-03-20 09:00:00','socio','Juan Pérez','innovacode1857@gmail.com',550,1000,'2026-03-31 01:58:04','2026-03-31 01:58:04');
/*!40000 ALTER TABLE `harvests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_items`
--

DROP TABLE IF EXISTS `inventory_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `inventory_items` (
  `id` char(36) NOT NULL,
  `name` varchar(80) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 0,
  `unit` varchar(20) NOT NULL,
  `category` enum('planta','fertilizante','pesticida','herramienta') NOT NULL,
  `recorded_by` varchar(40) DEFAULT NULL,
  `recorded_by_partner_name` varchar(120) DEFAULT NULL,
  `recorded_by_user` varchar(120) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_inventory_name` (`name`),
  KEY `idx_inventory_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_items`
--

LOCK TABLES `inventory_items` WRITE;
/*!40000 ALTER TABLE `inventory_items` DISABLE KEYS */;
INSERT INTO `inventory_items` VALUES ('b100-0001','Fertilizante NPK 15-15-15',80,'kg','fertilizante','socio','Carlos Rojas','innovacode1857@gmail.com','2026-03-31 01:58:04','2026-03-31 01:58:04'),('b100-0002','Abono Orgánico Compost',45,'kg','fertilizante','socio','Carlos Rojas','innovacode1857@gmail.com','2026-03-31 01:58:04','2026-03-31 01:58:04'),('b100-0003','Fertilizante B',0,'kg','fertilizante','socio','Carlos Rojas','innovacode1857@gmail.com','2026-03-31 01:58:04','2026-03-31 01:58:04'),('b100-0004','Insecticida Bifentrina',3,'litros','pesticida','socio','Juan Pérez','innovacode1857@gmail.com','2026-03-31 01:58:04','2026-03-31 01:58:04'),('b100-0005','Fungicida Cúprico',12,'litros','pesticida','socio','Juan Pérez','innovacode1857@gmail.com','2026-03-31 01:58:04','2026-03-31 01:58:04'),('b100-0006','Herbicida Glifosato',0,'litros','pesticida','socio','Juan Pérez','innovacode1857@gmail.com','2026-03-31 01:58:04','2026-03-31 01:58:04'),('b100-0007','Tijeras de Poda',8,'unidades','herramienta','socio','María González','innovacode1857@gmail.com','2026-03-31 01:58:04','2026-03-31 01:58:04'),('b100-0008','Manguera 50m',4,'unidades','herramienta','socio','Ana Fuentes','innovacode1857@gmail.com','2026-03-31 01:58:04','2026-03-31 01:58:04'),('b100-0009','Maceteros 20cm',90,'unidades','herramienta','socio','Ana Fuentes','innovacode1857@gmail.com','2026-03-31 01:58:04','2026-03-31 01:58:04'),('b100-0010','Malla Antiplagas',0,'metros','herramienta','socio','María González','innovacode1857@gmail.com','2026-03-31 01:58:04','2026-03-31 01:58:04'),('b100-0011','Guantes de Trabajo',15,'pares','herramienta','socio','Fran','innovacode1857@gmail.com','2026-03-31 01:58:04','2026-03-31 01:58:04'),('b100-0012','Carretilla de Jardín',2,'unidades','herramienta','socio','Carlos Rojas','innovacode1857@gmail.com','2026-03-31 01:58:04','2026-03-31 01:58:04');
/*!40000 ALTER TABLE `inventory_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `losses`
--

DROP TABLE IF EXISTS `losses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `losses` (
  `id` char(36) NOT NULL,
  `product_name` varchar(80) NOT NULL,
  `quantity` int(11) NOT NULL,
  `reason` varchar(160) NOT NULL,
  `date` datetime NOT NULL,
  `recorded_by` varchar(40) DEFAULT NULL,
  `recorded_by_partner_name` varchar(120) DEFAULT NULL,
  `recorded_by_user` varchar(120) DEFAULT NULL,
  `source_type` enum('inventory','harvest') DEFAULT NULL,
  `source_id` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_losses_date` (`date`),
  KEY `idx_losses_product` (`product_name`),
  KEY `idx_losses_source` (`source_type`,`source_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `losses`
--

LOCK TABLES `losses` WRITE;
/*!40000 ALTER TABLE `losses` DISABLE KEYS */;
INSERT INTO `losses` VALUES ('c100-0001','Rosa Roja',25,'Daño por helada nocturna','2025-11-15 10:00:00','socio','María González','innovacode1857@gmail.com','inventory','b100-0001','2026-03-31 01:58:04','2026-03-31 01:58:04'),('c100-0002','Girasol',40,'Plaga de áfidos - tratamiento tardío','2025-12-10 09:30:00','socio','Carlos Rojas','innovacode1857@gmail.com','inventory','b100-0003','2026-03-31 01:58:04','2026-03-31 01:58:04'),('c100-0003','Clavel Rojo',30,'Exceso de humedad en bodega','2026-01-18 08:00:00','socio','Juan Pérez','innovacode1857@gmail.com','inventory','b100-0004','2026-03-31 01:58:04','2026-03-31 01:58:04'),('c100-0004','Lavanda',15,'Corte incorrecto en cosecha','2026-02-05 11:00:00','socio','Fran','innovacode1857@gmail.com','inventory','b100-0002','2026-03-31 01:58:04','2026-03-31 01:58:04'),('c100-0005','Rosa Roja',18,'Temperatura de transporte alta','2026-03-12 14:00:00','socio','María González','innovacode1857@gmail.com','inventory','b100-0001','2026-03-31 01:58:04','2026-03-31 01:58:04'),('c100-0006','Rosa Amarilla',22,'Deterioro por tiempo en bodega','2026-03-25 09:00:00','socio','María González','innovacode1857@gmail.com','inventory','b100-0007','2026-03-31 01:58:04','2026-03-31 01:58:04');
/*!40000 ALTER TABLE `losses` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-30 23:13:38
