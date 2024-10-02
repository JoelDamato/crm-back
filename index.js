const express = require('express');
const axios = require('axios');
const cors = require('cors');  // Importar el paquete CORS
const app = express();

app.use(cors());
app.use(express.json());

app.post('/submit', async (req, res) => {
    const { name, phone, email } = req.body;
    console.log("Datos recibidos en el backend:", { name, phone, email });

    // Configurar los datos para Notion, incluyendo el campo de "Teléfono"
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
                        name: 'Damas inquebrantables'  // Proyecto fijo
                    }
                ]
            }
        }
    };

    try {
        // Hacer la petición POST a Notion
        const response = await axios.post('https://api.notion.com/v1/pages', notionData, {
            headers: {
                'Authorization': 'Bearer secret_uCBoeC7cnlFtq7VG4Dr58nBYFLFbR6dKzF00fZt2dq',  // Reemplaza con tu clave API de Notion
                'Content-Type': 'application/json',
                'Notion-Version': '2022-06-28'
            }
        });

        // Enviar una respuesta exitosa al cliente
        res.status(200).json({ message: 'Datos enviados correctamente a Notion' });

    } catch (error) {
        console.error('Error al enviar a Notion:', error);  // Log para verificar el error
        res.status(500).json({ message: 'Error al enviar los datos a Notion' });
    }
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
