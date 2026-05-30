# General

## Objetivos por tema y sus calificaciones

### Casos de uso inicialmente planteados

- **Valor maximo:** 5 puntos
- **Calificacion obtenida:** 4.00 puntos
- **Justificacion:** El proyecto implementa casos de uso completos: publicacion de viajes, solicitudes de viaje, chat en tiempo real, calificaciones, notificaciones, reporte de incidentes, recuperacion de contrasena y modo conductor. Sin embargo, el endpoint de incidentes tiene un usuario hardcodeado para pruebas, lo que indica que no esta completamente funcional en produccion.

### Buenas practicas de codigo

- **Valor maximo:** 5 puntos
- **Calificacion obtenida:** 3.75 puntos
- **Justificacion:** Excelente modularizacion en ambos lados. Frontend: components, hooks (mutations/queries), screens, services, context. Backend: routers separados por dominio (auth, usuarios, conductor, viajes, solicitudes, chat, notificaciones, incidentes, calificaciones), services para logica de negocio (cloudinary, cron, map, vision), y oRPC context/middleware. Sin embargo, no hay un sistema centralizado de manejo de errores (error middleware global), y algunos errores se manejan de forma inconsistente. Las validaciones con Zod son solidas en todos los endpoints.

### Autenticacion basica solida

- **Valor maximo:** 5 puntos
- **Calificacion obtenida:** 4.00 puntos
- **Justificacion:** Implementacion solida: JWT con expiracion de 7 dias, bcryptjs con 10 salt rounds para hash de contrasenas, middleware de autenticacion en oRPC para rutas protegidas, autenticacion de Socket.IO, almacenamiento seguro en AsyncStorage. Flujo completo de login, registro, forgot password con codigos de verificacion.

## Objetivos que se necesitan para aumentar la calificacion

- Completar la funcionalidad del endpoint de incidentes (actualmente usa usuario hardcodeado)
- Implementar middleware global centralizado de manejo de errores
- Estandarizar el formato de respuestas de error en todos los endpoints

## Calificacion por tema

**11.75/15**

# Frontend

## Objetivos por tema y sus calificaciones

### Uso correcto de React

- **Valor maximo:** 6.25 puntos
- **Calificacion obtenida:** 6.25 puntos
- **Justificacion:** Se utiliza Expo con React Native de forma correcta. Componentes funcionales con hooks, manejo de estado con useState y useEffect, contexto con createContext para modo conductor. Hooks personalizados bien organizados: useSesion, useSocketInvalidator, useBackHandler. Mutations y queries separadas en archivos dedicados. No hay abuso de hooks ni efectos secundarios no controlados.

### TanStack Query (manejador HTTP con cache)

- **Valor maximo:** 6.25 puntos
- **Calificacion obtenida:** 3.75 puntos
- **Justificacion:** TanStack Query esta instalado y se usa en los hooks de queries y mutations con invalidacion de cache via socket. Sin embargo, el cliente oRPC no configura explicitamente un cache manager o stale time personalizado. No se evidencia uso avanzado de invalidacion de cache mas alla de la invalidacion manual via socket. Falta configuracion de retry, refetchOnWindowFocus, o strategies de cache por defecto.

### Uso correcto del framework elegido (navegacion y buenas practicas)

- **Valor maximo:** 6.25 puntos
- **Calificacion obtenida:** 0.00 puntos
- **Justificacion:** Se usa Expo como plataforma, pero la navegacion es completamente personalizada via useState en App.tsx. No se implementa ningun sistema de navegacion de Expo (expo-router, o el sistema de navegacion que provee el framework). El objeto navigation es un mock sin funcionalidad real de stack, deep linking, o transiciones. No se aprovechan las capacidades de navegacion que provee Expo. Las buenas practicas del framework no se cumplen.

### Composabilidad (UI reutilizable)

- **Valor maximo:** 6.25 puntos
- **Calificacion obtenida:** 5.00 puntos
- **Justificacion:** Componentes reutilizables en src/components/common: Button, Card, Input, Footer, Header, HeaderBack, ScreenWrapper. Tambien hay componentes de dominio reutilizables: chatCard, driverCard, EmergencyButton, LiveMapModal. Sin embargo, faltan componentes como modales, loaders o estados vacios que serian reutilizables.

## Objetivos que se necesitan para aumentar la calificacion

- Implementar el sistema de navegacion de Expo (expo-router) para navegacion nativa con stack y deep linking
- Configurar TanStack Query con stale time, cache strategies y retry personalizado
- Agregar componentes UI faltantes: modales, loaders, estados vacios, snackbars

## Calificacion por tema

**15.00/25**

# Back End

## Objetivos por tema y sus calificaciones

### Uso correcto de REST APIs / RPC

- **Valor maximo:** 8.34 puntos
- **Calificacion obtenida:** 7.34 puntos
- **Justificacion:** Uso de oRPC para API type-safe con definicion clara de routers, procedures, inputs y outputs. Endpoints bien definidos con prefijos logicos (/rpc/auth.*, /rpc/usuarios.*, /rpc/viajes.*, etc.). Validaciones Zod implementadas en todos los endpoints. Sin embargo, todas las respuestas exitosas retornan HTTP 200 inclusive para creaciones y eliminaciones. No se usa 201 Created, 204 No Content, ni ningun otro codigo 2xx. Hay dos formatos de error distintos: oRPC retorna { error: { code, message } } y el rate limiter retorna { success: false, message }.

### Uso de middlewares (rutas protegidas segun autenticacion)

- **Valor maximo:** 8.33 puntos
- **Calificacion obtenida:** 8.33 puntos
- **Justificacion:** Middleware de autenticacion JWT bien implementado en oRPC/middleware.ts. protectedProcedure protege todas las rutas que requieren autenticacion. baseProcedure permite rutas publicas. Socket.IO tambien tiene middleware de autenticacion. Rate limiting implementado para login y registro.

### Uso de base de datos / ORM

- **Valor maximo:** 8.33 puntos
- **Calificacion obtenida:** 8.33 puntos
- **Justificacion:** Prisma ORM con PostgreSQL. Schema completo con 14 tablas, relaciones bien definidas, enums para estados. 13 migraciones documentadas. Patron de singleton para PrismaClient. Consultas complejas con includes, where, orderBy. Cron job para limpiar viajes expirados.

## Objetivos que se necesitan para aumentar la calificacion

- Usar codigos HTTP correctos en respuestas exitosas: 201 para creaciones (registro, publicar viaje, calificar), 204 para eliminaciones (eliminar notificacion, eliminar historial de chat)
- Unificar el formato de respuestas de error en todo el backend
- Implementar error handler global en Express para errores de Multer y otros errores no capturados

## Calificacion por tema

**24.00/25**

# Testing

## Objetivos por tema y sus calificaciones

### Testing Unitario (por lo menos 3 casos)

- **Valor maximo:** 3.75 puntos
- **Calificacion obtenida:** 0 puntos
- **Justificacion:** No existe ningun archivo de test unitario en el proyecto (.test.ts, .spec.ts). No hay configuracion de Jest, Vitest o cualquier otro framework de testing. El unico archivo de prueba es test-map.ts que es un script manual sin integracion con test runner.

### Testing de Integracion (por lo menos 3 casos)

- **Valor maximo:** 3.75 puntos
- **Calificacion obtenida:** 0 puntos
- **Justificacion:** No existen tests de integracion. No hay pruebas que validen la interaccion entre dos funcionalidades del sistema (ej: auth + viajes, chat + notificaciones, conductor + solicitudes). No hay configuracion de ningun framework de testing.

### Testing E2E (por lo menos 3 casos)

- **Valor maximo:** 3.75 puntos
- **Calificacion obtenida:** 0 puntos
- **Justificacion:** No existen tests end-to-end. No hay configuracion de Maestro ni de ninguna otra herramienta E2E. No hay flujos completos de usuario testeados (login, publicar viaje, solicitar viaje, etc.).

### Tests corren en GitHub Actions

- **Valor maximo:** 3.75 puntos
- **Calificacion obtenida:** 0 puntos
- **Justificacion:** No existe directorio .github/ ni ningun workflow de GitHub Actions configurado. No hay pipeline de CI/CD. No hay automatizacion de testing en ningun entorno.

## Objetivos que se necesitan para aumentar la calificacion

- Instalar y configurar Jest o Vitest tanto para frontend como backend
- Crear al menos 3 tests unitarios en el proyecto (funciones de utilidades, servicios o validaciones)
- Crear al menos 3 tests de integracion que validen la interaccion entre dos funcionalidades (sin base de datos)
- Configurar Maestro para tests E2E del mobile app con flujos de usuario
- Crear workflow de GitHub Actions que ejecute los tests automaticamente

## Calificacion por tema

**0/15**

# Build y Deploy

## Objetivos por tema y sus calificaciones

### Dockerfile del backend

- **Valor maximo:** 5 puntos
- **Calificacion obtenida:** 5 puntos
- **Justificacion:** Dockerfile completo y funcional. Usa node:20-alpine como base, instala dependencias con npm ci, ejecuta prisma generate y migrate deploy antes de iniciar el servidor. Optimizado con copia de package.json primero para aprovechar cache de Docker.

### Docker Compose con BE y BDD

- **Valor maximo:** 5 puntos
- **Calificacion obtenida:** 5 puntos
- **Justificacion:** Docker Compose configurado con dos servicios: db (PostgreSQL 16 Alpine) y backend. Incluye health check para PostgreSQL, variables de entorno configuradas, volumenes para persistencia de datos y uploads, dependencia correcta del backend sobre la base de datos sana.

### BE y BDD corriendo correctamente con Docker localmente

- **Valor maximo:** 5 puntos
- **Calificacion obtenida:** 5 puntos
- **Justificacion:** La configuracion esta completa y la arquitectura es correcta. El docker-compose define correctamente la red, puertos, volumenes y health checks. El batch file Levantar servidores.bat levanta backend y base de datos de forma funcional. El Dockerfile ejecuta prisma generate y migrate deploy al iniciar, asegurando que la base de datos este lista.

## Calificacion por tema

**15/15**

# Logging

## Objetivos por tema y sus calificaciones

### Uso correcto de logging

- **Valor maximo:** 5 puntos
- **Calificacion obtenida:** 3 puntos
- **Justificacion:** Se usa console.log y console.error extensamente en el backend (60+ ocurrencias) cubriendo lifecycle del servidor, socket events, autenticacion, file operations, cron jobs y errores. El logging cubre las areas criticas del sistema. Sin embargo, no hay niveles de log configurables (debug, info, warn, error) y los logs usan emojis en lugar de un formato estandar.

## Objetivos que se necesitan para aumentar la calificacion

- Configurar niveles de log (debug, info, warn, error) con configuracion por ambiente

## Calificacion por tema

**3/5**

# TOTAL

- **Calificacion final:** 68.75/100
- **Areas prioritarias de mejora:** Testing (0/15), Frontend - Navegacion y framework (0/6.25), Frontend - TanStack Query (3.75/6.25)
- **Fortalezas principales:** Build y Deploy (15/15), Backend - Middlewares y ORM (16.66/16.66), General (11.75/15)
