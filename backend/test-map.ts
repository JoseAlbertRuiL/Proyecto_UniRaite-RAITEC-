// Importamos la función que acabamos de crear
import { estaCercaDeRuta } from './src/services/mapService';
import logger from './src/services/logger';
// ============================================================================
// SIMULACIÓN DE DATOS
// ============================================================================

// 🚗 CONductor: Va desde el Centro histórico hasta el ITM (Instituto Tecnológico de Morelia)
const conductor = {
  origenLat: 19.7027,    // Centro
  origenLng: -101.1923,
  destinoLat: 19.7226,   // ITM
  destinoLng: -101.1858
};

// 🚶 PASAJERO 1: Está en la colonia Félix Ireta (Cerca de la ruta)
const pasajero1 = {
  lat: 19.7080,
  lng: -101.1890
};

// 🚶 PASAJERO 2: Está en Altozano (Súper lejos de la ruta)
const pasajero2 = {
  lat: 19.7080,
  lng: -101.1890
};

// ============================================================================
// EJECUCIÓN DE LAS PRUEBAS
// ============================================================================
logger.info("Iniciando pruebas de match con Turf.js", { modulo: "match_service" });

// Prueba 1: Pasajero Cerca (Límite 1km)
logger.info("Ejecutando prueba 1: Pasajero en Félix Ireta", { expected: true });
const match1 = estaCercaDeRuta(
  pasajero1.lat, pasajero1.lng,
  conductor.origenLat, conductor.origenLng,
  conductor.destinoLat, conductor.destinoLng,
  1.0 // Límite de 1 kilómetro
);
logger.info("Resultado de prueba 1", { matchObtenido: match1, testPass: match1 === true });

// Prueba 2: Pasajero Lejos (Límite 1km)
logger.info("Ejecutando prueba 2: Pasajero en Altozano", { expected: false });
const match2 = estaCercaDeRuta(
  pasajero2.lat, pasajero2.lng,
  conductor.origenLat, conductor.origenLng,
  conductor.destinoLat, conductor.destinoLng,
  1.0 // Límite de 1 kilómetro
);
logger.info("Resultado de prueba 2", { matchObtenido: match2, testPass: match2 === false });