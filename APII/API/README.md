# API AuraStøck

API REST multi-tenant para gestión de inventario y producción.

## Stack
- Node.js + Express 5
- MySQL (TiDB Serverless)
- JWT + bcrypt

## Endpoints

### Auth
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `GET /api/auth/tenants` - Listar empresas

### Producción
- `GET /api/produccion` - Listar producción
- `POST /api/produccion` - Crear lote
- `PUT /api/produccion/:id` - Actualizar
- `DELETE /api/produccion/:id` - Eliminar

### Inventario
- `GET /api/inventory` - Listar inventario
- `POST /api/inventory` - Agregar item
- `PUT /api/inventory/:id` - Actualizar
- `DELETE /api/inventory/:id` - Eliminar

### Mermas
- `GET /api/losses` - Listar mermas
- `POST /api/losses` - Registrar merma
- `DELETE /api/losses/:id` - Eliminar

## Deploy
1. Crear BD en TiDB Serverless desde `aurastock_schema.sql`
2. Configurar variables en Render
3. Deploy frontend en Vercel
