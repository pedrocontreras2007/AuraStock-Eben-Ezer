-- ============================================================
-- ESQUEMA COMPLETO AURASTØCK - Multi-tenant Inventory System
-- Compatible con MySQL / TiDB Serverless
-- ============================================================

CREATE DATABASE IF NOT EXISTS aurastock CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE aurastock;

-- ── EMPRESAS (Tenants) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenants (
  id CHAR(36) NOT NULL,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(60) NOT NULL UNIQUE,
  logo_url VARCHAR(255) DEFAULT NULL,
  contact_email VARCHAR(120) DEFAULT NULL,
  contact_phone VARCHAR(20) DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_tenants_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ── LOCALES / SUCURSALES (Branches) ──────────────────────
CREATE TABLE IF NOT EXISTS branches (
  id CHAR(36) NOT NULL,
  tenant_id CHAR(36) NOT NULL,
  name VARCHAR(120) NOT NULL,
  address VARCHAR(255) DEFAULT NULL,
  city VARCHAR(80) DEFAULT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  manager_name VARCHAR(120) DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_branches_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ── USUARIOS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) NOT NULL,
  tenant_id CHAR(36) NOT NULL,
  branch_id CHAR(36) DEFAULT NULL,
  email VARCHAR(120) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(120) NOT NULL,
  role ENUM('superadmin','admin','supervisor','operator') NOT NULL DEFAULT 'operator',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_email (email),
  KEY idx_users_tenant (tenant_id),
  KEY idx_users_branch (branch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ── INVENTARIO ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_items (
  id CHAR(36) NOT NULL,
  tenant_id CHAR(36) NOT NULL,
  branch_id CHAR(36) DEFAULT NULL,
  name VARCHAR(80) NOT NULL,
  quantity INT(11) NOT NULL DEFAULT 0,
  unit VARCHAR(20) NOT NULL DEFAULT 'unidades',
  category ENUM('insumo','relleno','empaque','utensilio','otro','materia_prima','salsas_gourmet','bebestibles','materiales_desechables','frutas','utiles_aseo') NOT NULL DEFAULT 'materia_prima',
  min_stock INT(11) DEFAULT 10,
  critical_stock INT(11) DEFAULT 5,
  recorded_by VARCHAR(40) DEFAULT NULL,
  recorded_by_user VARCHAR(120) DEFAULT NULL,
  inventory_date DATE DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_inventory_tenant (tenant_id),
  KEY idx_inventory_branch (branch_id),
  KEY idx_inventory_name (name),
  KEY idx_inventory_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ── PRODUCCIÓN (antes "harvests") ────────────────────────
CREATE TABLE IF NOT EXISTS produccion (
  id CHAR(36) NOT NULL,
  tenant_id CHAR(36) NOT NULL,
  branch_id CHAR(36) DEFAULT NULL,
  product_name VARCHAR(80) NOT NULL,
  category ENUM('lote_masa','lote_relleno','lote_preparado','otro') NOT NULL DEFAULT 'otro',
  quantity INT(11) NOT NULL DEFAULT 0,
  date DATETIME NOT NULL,
  recorded_by VARCHAR(40) DEFAULT NULL,
  recorded_by_user VARCHAR(120) DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_produccion_tenant (tenant_id),
  KEY idx_produccion_branch (branch_id),
  KEY idx_produccion_date (date),
  KEY idx_produccion_product (product_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ── MERMAS (Losses) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS losses (
  id CHAR(36) NOT NULL,
  tenant_id CHAR(36) NOT NULL,
  branch_id CHAR(36) DEFAULT NULL,
  product_name VARCHAR(80) NOT NULL,
  quantity INT(11) NOT NULL,
  reason VARCHAR(500) NOT NULL,
  date DATETIME NOT NULL,
  recorded_by VARCHAR(40) DEFAULT NULL,
  recorded_by_user VARCHAR(120) DEFAULT NULL,
  source_type ENUM('inventory','produccion') DEFAULT NULL,
  source_id CHAR(36) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_losses_tenant (tenant_id),
  KEY idx_losses_branch (branch_id),
  KEY idx_losses_date (date),
  KEY idx_losses_product (product_name),
  KEY idx_losses_source (source_type, source_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- SEED DATA - Inventario real 17/05/2026
-- Tenant: Eben Ezer / Sucursal: Avenida del Mar, Coquimbo
-- ============================================================
-- Email: admin@ebenezer.cl / Password: admin123
INSERT INTO tenants (id, name, slug, contact_email) VALUES
('t100-0000-0000-0000-000000000001', 'Eben Ezer', 'eben-ezer', 'contacto@ebenezer.cl');

INSERT INTO branches (id, tenant_id, name, address, city) VALUES
('b100-0000-0000-0000-000000000001', 't100-0000-0000-0000-000000000001', 'Local Coquimbo', 'Avenida del Mar', 'Coquimbo');

INSERT INTO users (id, tenant_id, branch_id, email, password_hash, name, role) VALUES
('u100-0000-0000-0000-000000000001', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'admin@ebenezer.cl', '$2b$10$MP.l3K0rSSoLCbhb2ommpupw10G/kk3PnoIDWupBG9k1WcSUAbLvm', 'Admin Eben Ezer', 'admin');

-- ============================================================
-- INVENTARIO COMPLETO - Avenida del Mar, Coquimbo
-- Fecha del inventario: 17/05/2026
-- ============================================================

-- ═══════════════════════════════════════════════════════════
-- INSUMOS - Lácteos, Harinas, Azúcares, Aceites, etc.
-- ═══════════════════════════════════════════════════════════
-- ANTES DE INSERTAR, limpia los datos parciales:
-- DELETE FROM inventory_items;
--
INSERT INTO inventory_items (id, tenant_id, branch_id, name, quantity, unit, category, min_stock, critical_stock) VALUES
('i200-0001', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Leche Entera', 7, 'cajas', 'insumo', 4, 2),
('i200-0002', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Leche Descremada', 8, 'cajas', 'insumo', 4, 2),
('i200-0003', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Leche Sin Lactosa', 8, 'cajas', 'insumo', 4, 2),
('i200-0004', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Leche Condensada', 0, 'unidades', 'insumo', 6, 3),
('i200-0005', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Azúcar Granulada', 23400, 'kg', 'insumo', 500, 100),
('i200-0006', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Manjar', 5, 'kg', 'relleno', 3, 1),
('i200-0007', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Azúcar Flor 500gr', 15, 'paquetes', 'insumo', 6, 3),
('i200-0008', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Azúcar Flor 1kg', 18, 'paquetes', 'insumo', 6, 3),
('i200-0009', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Harina', 19200, 'kg', 'insumo', 500, 100),
('i200-0010', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Aceite', 45, 'litros', 'insumo', 20, 10),
('i200-0011', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Sal', 3, 'kg', 'insumo', 2, 1),
('i200-0012', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Cacao', 150, 'unidades', 'insumo', 30, 10),
('i200-0013', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Pastelera (polvo)', 116, 'gr', 'insumo', 50, 20),
('i200-0014', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Nutella', 0, 'unidades', 'relleno', 4, 2);

-- ═══════════════════════════════════════════════════════════
-- SALSAS GOURMET (Rellenos)
-- ═══════════════════════════════════════════════════════════
INSERT INTO inventory_items (id, tenant_id, branch_id, name, quantity, unit, category, min_stock, critical_stock) VALUES
('i200-0015', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Salsa Frambuesa Gourmet', 3, 'unidades', 'relleno', 6, 3),
('i200-0016', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Salsa Caramelo Gourmet', 8, 'unidades', 'relleno', 6, 3),
('i200-0017', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Salsa Chocolate Gourmet', 7, 'unidades', 'relleno', 6, 3),
('i200-0018', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Salsas Varias (botella)', 40, 'unidades', 'relleno', 20, 10);

-- ═══════════════════════════════════════════════════════════
-- BEBESTIBLES (Insumos para venta)
-- ═══════════════════════════════════════════════════════════
INSERT INTO inventory_items (id, tenant_id, branch_id, name, quantity, unit, category, min_stock, critical_stock) VALUES
('i200-0019', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Té (unidades)', 101, 'unidades', 'insumo', 50, 20),
('i200-0020', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Mokaccino', 1, 'carga máquina', 'insumo', 1, 0),
('i200-0021', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Vainilla', 1, 'carga máquina', 'insumo', 1, 0),
('i200-0022', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Cappuccino', 1, 'carga máquina', 'insumo', 1, 0),
('i200-0023', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Tradición', 2, 'kg', 'insumo', 3, 1),
('i200-0024', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Kit Kat', 1, 'carga máquina', 'insumo', 1, 0),
('i200-0025', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Coca Cola Zero', 0, 'unidades', 'insumo', 24, 12),
('i200-0026', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Coca Cola Normal', 0, 'unidades', 'insumo', 24, 12),
('i200-0027', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Fanta', 0, 'unidades', 'insumo', 12, 6),
('i200-0028', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Sprite', 0, 'unidades', 'insumo', 12, 6),
('i200-0029', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Agua Sin Gas', 0, 'botellas', 'insumo', 24, 12),
('i200-0030', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Agua Con Gas', 0, 'botellas', 'insumo', 24, 12),
('i200-0031', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Bidones Agua Llenos', 4, 'unidades', 'insumo', 2, 1),
('i200-0032', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Bidones Agua Vacíos', 3, 'unidades', 'insumo', 2, 1),
('i200-0033', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Amaretto', 1, 'botellas', 'insumo', 2, 1),
('i200-0034', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Jarabe Menta', 1, 'botellas', 'insumo', 2, 1),
('i200-0035', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Ron', 1, 'botellas', 'insumo', 2, 1);

-- ═══════════════════════════════════════════════════════════
-- FRUTAS (Insumos)
-- ═══════════════════════════════════════════════════════════
INSERT INTO inventory_items (id, tenant_id, branch_id, name, quantity, unit, category, min_stock, critical_stock) VALUES
('i200-0036', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Melón', 0, 'unidades', 'insumo', 6, 3),
('i200-0037', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Piña', 77, 'unidades', 'insumo', 12, 6),
('i200-0038', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Maracuyá', 12, 'unidades', 'insumo', 12, 6),
('i200-0039', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Mora', 0, 'unidades', 'insumo', 6, 3),
('i200-0040', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Arándanos', 0, 'unidades', 'insumo', 6, 3),
('i200-0041', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Plátanos', 36, 'paquetes 4 mitades', 'insumo', 12, 6),
('i200-0042', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Naranja', 29, 'unidades', 'insumo', 12, 6),
('i200-0043', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Frambuesa', 22, 'unidades', 'insumo', 6, 3),
('i200-0044', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Kiwi', 6, 'unidades', 'insumo', 12, 6),
('i200-0045', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Manzana Verde', 4, 'unidades', 'insumo', 12, 6),
('i200-0046', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Manzana Roja', 7, 'unidades', 'insumo', 12, 6),
('i200-0047', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Duraznos', 0, 'unidades', 'insumo', 6, 3),
('i200-0048', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Peras', 17, 'unidades', 'insumo', 12, 6),
('i200-0049', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Limón', 7, 'unidades', 'insumo', 12, 6),
('i200-0050', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Frutilla', 141, 'unidades', 'insumo', 24, 12),
('i200-0051', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Papaya', 26, 'unidades', 'insumo', 6, 3),
('i200-0052', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Mangos', 21, 'unidades', 'insumo', 12, 6),
('i200-0053', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Sandía', 19, 'unidades', 'insumo', 6, 3);

-- ═══════════════════════════════════════════════════════════
-- MATERIAL DESECHABLE (Empaques)
-- ═══════════════════════════════════════════════════════════
INSERT INTO inventory_items (id, tenant_id, branch_id, name, quantity, unit, category, min_stock, critical_stock) VALUES
('i200-0054', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Vasos para Jugos', 144, 'unidades', 'empaque', 100, 50),
('i200-0055', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Tapas para Jugos', 48, 'unidades', 'empaque', 100, 50),
('i200-0056', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Vasos Café Grandes', 149, 'unidades', 'empaque', 100, 50),
('i200-0057', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Vasos Café Medianos', 68, 'unidades', 'empaque', 100, 50),
('i200-0058', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Vasos Café Chicos', 0, 'unidades', 'empaque', 100, 50),
('i200-0059', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Tapas Café Grandes', 0, 'unidades', 'empaque', 100, 50),
('i200-0060', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Tapas Café Medianas', 157, 'unidades', 'empaque', 100, 50),
('i200-0061', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Tapas Café Chicas', 0, 'unidades', 'empaque', 100, 50),
('i200-0062', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Bolsas Papel 4kg', 400, 'unidades', 'empaque', 100, 50),
('i200-0063', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Bolsas Papel 2kg', 500, 'unidades', 'empaque', 100, 50),
('i200-0064', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Gelatineros', 162, 'unidades', 'empaque', 100, 50),
('i200-0065', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Tapas Gelatineros', 156, 'unidades', 'empaque', 100, 50),
('i200-0066', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Bombillas Negras', 100, 'unidades', 'empaque', 100, 50),
('i200-0067', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Bombillas de Colores', 200, 'unidades', 'empaque', 100, 50),
('i200-0068', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Bolsas Porcionadoras', 4, 'bolsas', 'empaque', 3, 1),
('i200-0069', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Rollos Térmicos Grandes', 5, 'unidades', 'empaque', 5, 2),
('i200-0070', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Rollos Térmicos Chicos', 20, 'unidades', 'empaque', 10, 5),
('i200-0071', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Resma Papel Blanco', 1, 'resmas', 'empaque', 2, 1),
('i200-0072', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Resma Diario', 1, 'resmas', 'empaque', 2, 1),
('i200-0073', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Cajas Combo Familiar', 9, 'unidades', 'empaque', 10, 5),
('i200-0074', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Cajas Combo Mediano', 20, 'unidades', 'empaque', 10, 5),
('i200-0075', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Servilletas (paq x40)', 72, 'paquetes', 'empaque', 20, 10),
('i200-0076', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Palitos para Revolver', 85, 'unidades', 'empaque', 50, 25);

-- ═══════════════════════════════════════════════════════════
-- UTENSILIOS
-- ═══════════════════════════════════════════════════════════
INSERT INTO inventory_items (id, tenant_id, branch_id, name, quantity, unit, category, min_stock, critical_stock) VALUES
('i200-0077', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Caja Guantes', 1, 'cajas', 'utensilio', 2, 1),
('i200-0078', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Cofias (bolsa)', 1, 'bolsas', 'utensilio', 1, 0),
('i200-0079', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Cinta Scotch', 1, 'unidades', 'utensilio', 2, 1);

-- ═══════════════════════════════════════════════════════════
-- ÚTILES DE ASEO Y OTROS
-- ═══════════════════════════════════════════════════════════
INSERT INTO inventory_items (id, tenant_id, branch_id, name, quantity, unit, category, min_stock, critical_stock) VALUES
('i200-0080', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Esponjas', 4, 'unidades', 'otro', 3, 1),
('i200-0081', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Poett', 1, 'unidades', 'otro', 2, 1),
('i200-0082', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Lava Losa', 1, 'unidades', 'otro', 2, 1),
('i200-0083', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Cloro', 2, 'unidades', 'otro', 2, 1),
('i200-0084', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Bolsas Basura Camiseta', 1, 'paquetes', 'otro', 2, 1),
('i200-0085', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Bolsas Basura Grandes', 0, 'paquetes', 'otro', 2, 1),
('i200-0086', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Bolsas Basura Medianas', 1, 'paquetes', 'otro', 2, 1),
('i200-0087', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Cif', 1, 'unidades', 'otro', 2, 1),
('i200-0088', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Virutillas', 2, 'bolsas', 'otro', 2, 1),
('i200-0089', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Mata Moscas', 2, 'unidades', 'otro', 2, 1),
('i200-0090', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Desodorante Ambiental', 1, 'unidades', 'otro', 2, 1),
('i200-0091', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Paños para Piso', 0, 'unidades', 'otro', 3, 1),
('i200-0092', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Confort', 0, 'unidades', 'otro', 6, 3),
('i200-0093', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Fósforos', 9, 'cajas', 'otro', 4, 2),
('i200-0094', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Paños Amarillos', 5, 'paquetes', 'otro', 3, 1),
('i200-0095', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Desengrasante', 0, 'unidades', 'otro', 2, 1),
('i200-0096', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Gas (cilindros)', 0, 'cilindros', 'otro', 2, 0),
('i200-0097', 't100-0000-0000-0000-000000000001', 'b100-0000-0000-0000-000000000001', 'Salsas (botella)', 40, 'unidades', 'relleno', 15, 8);
