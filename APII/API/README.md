## API Floricoop

API REST en Express 5 que sirve datos de cosechas, inventario y mermas para la aplicación Angular.

### Requisitos

- Node.js 18+ (probado con 18 LTS)
- MySQL 8 (o compatible) con las tablas `harvests`, `inventory_items` y `losses`

### Configuración

1. Copia `.env.example` en `.env` y completa los datos de conexión y los orígenes permitidos.
2. Instala dependencias y levanta el servidor:

```bash
npm install
npm start
```

El servidor usa `APP_PORT` (por defecto 3000) y expone:

- `GET/POST/PUT/DELETE /api/harvests`
- `GET/POST/PUT/DELETE /api/inventory`
- `GET/POST/DELETE /api/losses`

### Notas

- `ALLOWED_ORIGINS` acepta una lista separada por comas que la capa CORS utilizará para validar solicitudes.
- Todas las consultas SQL usan parámetros para evitar inyecciones.
- Las respuestas normalizan los nombres de campos a camelCase para alinearse con el frontend Angular.

### Base de datos

- El archivo `docs/schema.sql` contiene un esquema de referencia con las columnas necesarias (`recorded_by_user`, `source_type`, `source_id`, etc.).
- El script `docs/init-db.sql` crea la base `flcp_ic`, el usuario de ejemplo y carga algunos datos iniciales.
- Si trabajas con migraciones propias, asegúrate de incluir esos campos y los índices indicados para mantener la compatibilidad con la API.
