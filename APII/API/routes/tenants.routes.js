/*import express from 'express'; // Importa express para crear rutas
import TenantsService from '../services/tenants.services.js'; // Importa el servicio de tenants
const router = express.Router(); // Crea una instancia de router de express

export default(db) => {
    const Tenants = TenantsService(db); // Inicializa el servicio de tenants con la base de datos

    /** Ruta para obtener todos los datos de tenants **/
    /*router.get('/', async (req, res) => {
        const qData = await Tenants.findAll(); // Llama al método para obtener todos los tenants
        let data = qData.data; // Obtiene los datos
        let status = qData.status; // Obtiene el status de la respuesta
        let message = qData.message; // Obtiene el mensaje de la respuesta
        let totalCount = qData.totalCount; // Obtiene el conteo total de registros
        let error = qData.error; // Obtiene cualquier error
        res.status(status).json({ data, message, totalCount, error }); // Devuelve la respuesta en formato JSON
    });

    /** Ruta para obtener un tenant por ID (un solo registro) **/
    /*router.get('/:id', async (req, res) => {
        // Aquí se implementaría la lógica para obtener un tenant por su ID
        const qData = await Tenants.findById(req.params.id); // Llama al método para obtener los tenant por ID
        let data = qData.data; // Obtiene los datos
        let status = qData.status; // Obtiene el status de la respuesta
        let message = qData.message; // Obtiene el mensaje de la respuesta
        let totalCount = qData.totalCount; // Obtiene el conteo total de registros
        let error = qData.error; // Obtiene cualquier error
        res.status(status).json({ data, message, totalCount, error }); // Devuelve la respuesta en formato JSON
    });

    /** Ruta para insertar datos y crear nuevo registro **/
    /*router.post('/', async (req, res) => {
        // Aquí se implementaría la lógica para crear un nuevo tenant
        const qData = await Tenants.create(req.body); // Llama al método para crear un nuevo tenant
        //Si affectedRows > 0, la operación fue exitosa (El tenant se creo correctamente)
        let result = qData.data.affectedRows; // Obtiene el número de filas afectadas
        console.log(qData);
        let data = qData.data; // Obtiene los datos
        let status = qData.status; // Obtiene el status de la respuesta
        let message = qData.message; // Obtiene el mensaje de la respuesta
        let totalCount = qData.totalCount; // Obtiene el conteo total de registros
        let error = qData.error; // Obtiene cualquier error
        res.status(status).json({ data, message, totalCount, error }); // Devuelve la respuesta en formato JSON 
    });

    /** Ruta para actualizar datos/registro (total) **/
    /*router.put('/:id', async (req, res) => {
        // Aquí se implementaría la lógica para actualizar completamente un tenant
        const qData = await Tenants.update(req.params.id, req.body); // Llama al método para actualizar un tenant
        let data = qData.data; // Obtiene los datos
        let status = qData.status; // Obtiene el status de la respuesta
        let message = qData.message;    // Obtiene el mensaje de la respuesta
        let totalCount = qData.totalCount; // Obtiene el conteo total de registros
        let error = qData.error; // Obtiene cualquier error
        res.status(status).json({ data, message, totalCount, error }); // Devuelve la respuesta en formato JSON 
    });

    /** Ruta para eliminar un registro **/
    /*router.delete('/:id', async (req, res) => {
        // Aquí se implementaría la lógica para eliminar un tenant
        const qData = await Tenants.delete(req.params.id); // Llama al método para eliminar un tenant
        let data = qData.data; // Obtiene los datos
        let status = qData.status;  // Obtiene el status de la respuesta 
        let message = qData.message;    // Obtiene el mensaje de la respuesta
        let totalCount = qData.totalCount; // Obtiene el conteo total de registros
        let error = qData.error; // Obtiene cualquier error
        res.status(status).json({ data, message, totalCount, error }); // Devuelve la respuesta en formato JSON
    });

    return router; // Retorna el router configurado
};*/