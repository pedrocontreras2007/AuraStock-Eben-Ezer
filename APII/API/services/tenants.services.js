/*import { v4 as uuidv4 } from 'uuid'; // Importa la función para generar UUIDs 

// Exporta una función que recibe la instancia de la base de datos
export default (db) => ({
    // Método para obtener todos los registros de la tabla tenants
    async findAll() {
        let query = 'SELECT * FROM tenants'; // Consulta SQL para obtener todos los tenants
        try {
            const results = await db.mysqlquery(query); // Ejecuta la consulta usando el método mysqlquery del objeto db
            const totalCount = results.data.length; // Obtiene el total de registros encontrados
            const HTTPCode = totalCount > 0 ? 200 : 404; // Determina el código HTTP basado en si se encontraron registros
            return { 
                success: true, 
                status: HTTPCode, 
                data: results.data, 
                totalCount, 
                error: null }; // Devuelve los resultados y el total
        }catch (error) {
            console.log(error)
            return { 
                success: false, 
                status: 500, 
                data: [], 
                totalCount: 0, 
                error: error.message }; // Devuelve el mensaje de error si ocurre alguno
        }

    },

    async findById(id) {
        let query = `SELECT * FROM tenants WHERE id = '${id}'`; // Consulta SQL para obtener un tenant por ID
        console.log(query);
        try {
            const results = await db.mysqlquery(query); // Ejecuta la consulta usando el método mysqlquery del objeto db
            const totalCount = results.data.length; // Obtiene el total de registros encontrados
            const HTTPCode = totalCount > 0 ? 200 : 404; // Determina el código HTTP basado en si se encontraron registros
            return { 
                success: true, 
                status: HTTPCode, 
                data: results.data, 
                totalCount, 
                error: null }; // Devuelve los resultados y el total
        }catch (error) {
            return { 
                success: false, 
                status: 500, 
                data: [], 
                totalCount: 0, 
                error: error.message }; // Devuelve el mensaje de error si ocurre alguno
        }
    },
    
    async create(data) {
        const id = uuidv4(); // Genera un nuevo UUID para el ID del tenant
        const query = `INSERT INTO tenants (id, name,
        contact_email, contact_phone) 
        VALUES ('${id}', '${data.name}',
        '${data.contact_email}', '${data.contact_phone}');`; // Consulta SQL para insertar un nuevo tenant
        try{
            const results = await db.mysqlquery(query); // Ejecuta la consulta usando el método mysqlquery del objeto db
            const affectedRows = results.data.affectedRows; // Obtiene el número de filas afectadas por la inserción
            const HTTPCode = affectedRows > 0 ? 201 : 500;
            return { 
                success: true, 
                status: HTTPCode,
                data: {id: id},
                totalCount: affectedRows,
                error: null }; // Devuelve el ID del nuevo tenant y el número de filas afectadas
        }catch (error) {
            return { 
                success: false, 
                status: 500, 
                data: {}, 
                totalCount: 0, 
                error: error.message }; // Devuelve el mensaje de error si ocurre alguno
        }
    },

    async update(id, data) {
        // Aquí se implementaría la lógica para actualizar un tenant
        let query = `UPDATE tenants SET 
        name='${data.name}',
        contact_email= '${data.contact_email}', 
        contact_phone= '${data.contact_phone}' 
        WHERE id='${id}';`;
        try{
            const results = await db.mysqlquery(query); // Ejecuta la consulta usando el método mysqlquery del objeto db
            console.log(results);
            //TODO: Corregir el código de estado
            const HTTPCode = results.data.affectedRows > 0 ? 200 : 404;
            return { 
                success: true, 
                status: HTTPCode,
                data: results,
                totalCount: 0,
                error: null }; // Devuelve el ID del nuevo tenant y el número de filas afectadas
        }catch (error) {
            return { 
                success: false, 
                status: 500, 
                data: [], 
                totalCount: 0, 
                error: error.message }; // Devuelve el mensaje de error si ocurre alguno
        }
    },

    async delete(id) {
        // Aquí se implementaría la lógica para eliminar un tenant
        let query = `DELETE FROM tenants WHERE id = ${id};`;
        try{
            const results = await db.mysqlquery(query); // Ejecuta la consulta usando el método mysqlquery del objeto db
            console.log(results);
            //TODO: Corregir el código de estado
            const HTTPCode = results.length > 0 ? 200 : 404;
            return { 
                success: true, 
                status: HTTPCode,
                data: results,
                totalCount: 0,
                error: null }; // Devuelve el ID del nuevo tenant y el número de filas afectadas
        }catch (error) {
            return {
                success: false, 
                status: 500, 
                data: [],
                totalCount: 0,
                error: error.message }; // Devuelve el mensaje de error si ocurre alguno
        }
    }
});*/