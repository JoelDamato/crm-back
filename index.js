const express = require('express');
const axios = require('axios');
const cors = require('cors');  
const app = express();

app.use(cors());
app.use(express.json());

app.post('/submit', async (req, res) => {
    const { name, phone, email, etiqueta } = req.body;
    console.log("Datos recibidos en el backend:", { name, phone, email, etiqueta });

    // Iniciar medición de tiempo
    console.time('Tiempo de ejecución total');

    try {
        // Medir el tiempo que tarda la búsqueda en Notion
        console.time('Búsqueda en Notion');
        const searchResponse = await axios.post(
            'https://api.notion.com/v1/databases/e1c86c0d490c4ccdb7b3d92007dea981/query', 
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
                    'Authorization': 'Bearer secret_uCBoeC7cnlFtq7VG4Dr58nBYFLFbR6dKzF00fZt2dq',  
                    'Content-Type': 'application/json',
                    'Notion-Version': '2022-06-28'
                }
            }
        );
        console.timeEnd('Búsqueda en Notion'); // Fin de la medición de búsqueda

        // Verificar si ya existe un registro con el número de teléfono
        if (searchResponse.data.results.length > 0) {
            console.timeEnd('Tiempo de ejecución total'); // Finaliza la medición total
            return res.status(409).json({ message: 'El número de teléfono ya está registrado' });
        }

        // Enviar una respuesta inmediatamente al frontend
        res.status(200).json({ message: 'Redirigiendo a WhatsApp...' });

        // Medir el tiempo que tarda la creación del registro en Notion
        console.time('Creación de registro en Notion');
        const notionData = {
            parent: { database_id: 'e1c86c0d490c4ccdb7b3d92007dea981' },  
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

        await axios.post('https://api.notion.com/v1/pages', notionData, {
            headers: {
                'Authorization': 'Bearer secret_uCBoeC7cnlFtq7VG4Dr58nBYFLFbR6dKzF00fZt2dq',  
                'Content-Type': 'application/json',
                'Notion-Version': '2022-06-28'
            }
        });
        console.timeEnd('Creación de registro en Notion'); // Fin de la medición de creación de registro

        console.log('Datos enviados correctamente a Notion');

    } catch (error) {
        console.error('Error al procesar la solicitud:', error); 
    }

    // Finalizar medición de tiempo total
    console.timeEnd('Tiempo de ejecución total');
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
