const express = require('express');
const axios = require('axios');
const cors = require('cors');  // Importar el paquete CORS
const app = express();

app.use(cors());
app.use(express.json());

app.post('/submit', async (req, res) => {
    const { name, phone, email, etiqueta } = req.body;
    console.log("Datos recibidos en el backend:", { name, phone, email, etiqueta });

    // Buscar en Notion si ya existe un número de teléfono
    try {
        const searchResponse = await axios.post('https://api.notion.com/v1/databases/e1c86c0d490c4ccdb7b3d92007dea981/query', 
        {
            filter: {
                property: 'Telefono',  // Asegúrate de que este campo coincida con el nombre exacto en Notion
                phone_number: {
                    equals: phone
                }
            }
        }, 
        {
            headers: {
                'Authorization': 'Bearer secret_uCBoeC7cnlFtq7VG4Dr58nBYFLFbR6dKzF00fZt2dq',  // Reemplaza con tu clave API de Notion
                'Content-Type': 'application/json',
                'Notion-Version': '2022-06-28'
            }
        });

        // Verificar si ya existe un registro con el número de teléfono
        if (searchResponse.data.results.length > 0) {
            // Si ya existe, enviar una respuesta indicando que el número está registrado
            return res.status(409).json({ message: 'El número de teléfono ya está registrado' });
        }

        // Si el número no está registrado, procedemos a crear un nuevo registro
        const notionData = {
            parent: { database_id: 'e1c86c0d490c4ccdb7b3d92007dea981' },  // ID de tu base de datos de Notion
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
                'Telefono': {  // Campo de tipo phone_number en Notion
                    phone_number: phone
                },
                'Proyecto': {
                    multi_select: [
                        {
                            name: etiqueta
                        }
                    ]
                }
            }
        };

        // Hacer la petición POST a Notion para crear el nuevo registro
        const createResponse = await axios.post('https://api.notion.com/v1/pages', notionData, {
            headers: {
                'Authorization': 'Bearer secret_uCBoeC7cnlFtq7VG4Dr58nBYFLFbR6dKzF00fZt2dq',  // Reemplaza con tu clave API de Notion
                'Content-Type': 'application/json',
                'Notion-Version': '2022-06-28'
            }
        });

        // Enviar una respuesta exitosa al cliente
        res.status(200).json({ message: 'Datos enviados correctamente a Notion' });

    } catch (error) {
        console.error('Error al procesar la solicitud:', error);  // Log para verificar el error
        res.status(500).json({ message: 'Error al procesar la solicitud' });
    }
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
