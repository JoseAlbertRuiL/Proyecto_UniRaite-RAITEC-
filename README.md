# UniRaite 🚗💨

**UniRaite** es una plataforma de movilidad colaborativa diseñada específicamente para la comunidad universitaria. Su objetivo es facilitar que los estudiantes compartan sus trayectos diarios, optimizando costos, reduciendo la huella de carbono y mejorando la seguridad en el transporte hacia y desde el campus.

---

## 🚀 Tecnologías Utilizadas

El proyecto se divide en un ecosistema robusto que utiliza las últimas tecnologías de desarrollo:

### 📱 Frontend (App Móvil)
- **Framework:** [React Native](https://reactnative.dev/) con [Expo](https://expo.dev/) (SDK 54).
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/) para un desarrollo tipado y seguro.
- **Estilos:** [NativeWind](https://www.nativewind.dev/) (Tailwind CSS para React Native).
- **Navegación:** [React Navigation v7](https://reactnavigation.org/).
- **Gestión de Estado y API:** [TanStack Query (React Query)](https://tanstack.com/query/latest).
- **Mapas:** [React Native Maps](https://github.com/react-native-maps/react-native-maps) con integración de Google Maps API.
- **Iconografía:** [Lucide React Native](https://lucide.dev/).

### 🛠️ Backend (Servidor)
- **Entorno:** [Node.js](https://nodejs.org/) con [Express](https://expressjs.com/).
- **ORM:** [Prisma](https://www.prisma.io/) para la interacción con la base de datos.
- **Validación:** [Zod](https://zod.dev/) para esquemas de datos seguros.
- **Comunicación en Tiempo Real:** [Socket.io](https://socket.io/) para chats y actualizaciones de ubicación.
- **Protocolo de API:** [oRPC](https://orpc.org/) para una comunicación cliente-servidor con tipos compartidos.

### 🗄️ Base de Datos y Almacenamiento
- **Base de Datos:** [PostgreSQL](https://www.postgresql.org/).
- **Almacenamiento de Imágenes:** [Cloudinary](https://cloudinary.com/).
- **Servicios Externos:** [Google Cloud Vision](https://cloud.google.com/vision) para la validación automática de documentos (Licencias/Tarjetas de circulación).

---

## ✨ Características Principales

- **Registro Seguro:** Verificación de identidad mediante OCR (Google Vision) para licencias y documentos del vehículo.
- **Búsqueda de Viajes:** Filtra por origen, destino y horarios.
- **Modo Conductor:** Permite a los usuarios publicar sus rutas y gestionar pasajeros.
- **Seguimiento en Tiempo Real:** Visualización del trayecto en el mapa.
- **Chat Integrado:** Comunicación directa entre conductor y pasajeros mediante WebSockets.
- **Historial de Viajes:** Registro detallado de trayectos pasados y pendientes.
- **Gestión de Perfil:** Configuración personalizada, cambio de contraseña y perfil público.

---

## 📂 Estructura del Proyecto

```text
Proyecto_UNIRAITE/
├── backend/                # Lógica del servidor, Prisma, Rutas y Sockets
│   ├── prisma/             # Esquema de base de datos
│   └── src/                # Código fuente del backend (Express + oRPC)
├── src/                    # Código fuente de la App Móvil
│   ├── components/         # Componentes reutilizables de UI
│   ├── screens/            # Pantallas principales (Login, Home, Chat, etc.)
│   ├── services/           # Clientes de API y lógica de negocio
│   └── hooks/              # Custom hooks de React
├── App.tsx                 # Punto de entrada de la aplicación
└── tailwind.config.js      # Configuración de estilos NativeWind
```

---

## 🛠️ Instalación y Configuración

### Requisitos Previos
- Node.js (v18+)
- Expo Go en tu dispositivo móvil o emulador.
- PostgreSQL en ejecución.

### Pasos

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/JoseAlbertRuiL/Proyecto_UniRaite-RAITEC-
   cd Proyecto_UniRaite-RAITEC-
   ```

2. **Configurar el Backend:**
   - Ve a la carpeta `backend`.
   - Instala las dependencias: `npm install`.
   - Configura el archivo `.env` con tus credenciales de base de datos y Cloudinary.
   - Ejecuta las migraciones de Prisma: `npx prisma migrate dev`.
   - Inicia el servidor: `npm run dev`.

3. **Configurar el Frontend:**
   - En la raíz del proyecto, instala las dependencias: `npm install`.
   - Inicia Expo: `npx expo start`.

---

## 🤝 Contribución

Este proyecto es parte del desarrollo de nuestro proyecto de Topicos Selectos de Ingenieria en 
Software del Instituto Tecnologico de Morelia, Esperamos que sea de gran utilidad para la comunidad 
y que podamos construir una comunidad mas unida y colaborativa.

---

## 📄 Licencia

Desarrollado por Ponys <3
