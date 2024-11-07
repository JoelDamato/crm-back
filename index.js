const express = require('express');
const axios = require('axios');
const cors = require('cors');  
const NodeCache = require('node-cache'); // Añadir NodeCache para almacenar en caché los números de teléfono
const app = express();

const phoneCache = new NodeCache({ stdTTL: 600 }); // Caché con tiempo de vida de 10 minutos (600 segundos)

app.use(cors());
app.use(express.json());

const notionDatabaseId = '12f0dad84cb78036a6bfe44f8b92f370';
const notionToken = 'Bearer secret_uCBoeC7cnlFtq7VG4Dr58nBYFLFbR6dKzF00fZt2dq';

// Ruta para enviar datos a Notion
app.post('/submit', async (req, res) => {
    const { name, phone, email } = req.body;
    console.log("Datos recibidos en el backend:", { name, phone, email });

    // Verificar si el número de teléfono ya está en caché
    if (phoneCache.has(phone)) {
        console.log("Número de teléfono ya registrado (desde caché).");
        return res.status(409).json({ message: 'El número de teléfono ya está registrado' });
    }

    try {
        // Iniciar medición de tiempo para la búsqueda en Notion
        console.time('Búsqueda en Notion');
        
        // Configuración de búsqueda en Notion por número de teléfono
        const searchResponse = await axios.post(
            `https://api.notion.com/v1/databases/${notionDatabaseId}/query`, 
            {
                filter: {
                    property: 'Telefono',
                    phone_number: {
                        equals: phone
                    }
                }
            },
            {
                headers: {
                    'Authorization': notionToken,  
                    'Content-Type': 'application/json',
                    'Notion-Version': '2022-06-28'
                }
            }
        );
        console.timeEnd('Búsqueda en Notion');

        // Verificar si el número de teléfono ya está registrado en Notion
        if (searchResponse.data.results.length > 0) {
            // Almacenar en caché el número de teléfono para evitar futuras búsquedas innecesarias
            phoneCache.set(phone, true);
            console.log("Número de teléfono ya registrado.");
            return res.status(409).json({ message: 'El número de teléfono ya está registrado' });
        }

        // Si no se encuentra, proceder a crear el registro en Notion
        console.time('Creación de registro en Notion');
        const notionData = {
            parent: { database_id: notionDatabaseId },
            properties: {
                'Nombre': {
                    title: [
                        {
                            text: {
                                content: name
                            }
                        }
                    ]
                },
                'Email': {
                    email: email
                },
                'Telefono': {  
                    phone_number: phone
                }
            }
        };

        const createResponse = await axios.post('https://api.notion.com/v1/pages', notionData, {
            headers: {
                'Authorization': notionToken,  
                'Content-Type': 'application/json',
                'Notion-Version': '2022-06-28'
            }
        });
        console.timeEnd('Creación de registro en Notion');

        console.log('Datos enviados correctamente a Notion:', createResponse.data);
        
        // Almacenar en caché el número de teléfono recién registrado
        phoneCache.set(phone, true);

        // Enviar una respuesta de éxito al frontend
        res.status(200).json({ message: 'Registro creado y redirigiendo a WhatsApp...' });

    } catch (error) {
        console.error('Error al procesar la solicitud:', error.response?.data || error.message);
        res.status(500).json({ message: 'Error en el servidor, por favor intente más tarde.' });
    }
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
