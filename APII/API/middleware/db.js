import mysql from 'mysql2/promise';

export default class DB {
    constructor() {
        this.pool = null;
    }

    // Configura la conexión usando los datos que le pases (vienen del .env)
    setDataConnection(data) {
        this.dataConnection = data;
        try {
            this.pool = mysql.createPool({
                host: data.host,
                user: data.user,
                password: data.password,
                database: data.database,
                port: data.port,
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0,
                multipleStatements: true // Útil si quieres ejecutar varios scripts a la vez
            });
            console.log(`✅ Configuración de Pool de conexión lista para: ${data.database}`);
        } catch (error) {
            console.error("❌ Error creando el pool de conexión:", error.message);
        }
    }

    // Ejecuta consultas SQL
    async mysqlquery(query, values = []) {
        let connection;
        try {
            // Pedimos una conexión al pool
            connection = await this.pool.getConnection();
            
            // Ejecutamos la consulta
            const [results] = await connection.execute(query, values);
            
            return { success: true, data: results };
        } catch (error) {
            console.error("❌ Error en consulta SQL:", error.message);
            console.error("Query fallida:", query); // Útil para depurar
            return { success: false, error: error.message };
        } finally {
            // ¡Crucial! Siempre liberar la conexión para que otros puedan usarla
            if (connection) connection.release();
        }
    }
}