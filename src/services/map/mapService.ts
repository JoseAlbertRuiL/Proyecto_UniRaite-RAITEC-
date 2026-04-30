import * as turf from '@turf/turf';

export const estaCercaDeRuta = (
  pasajeroLat:        number,
  pasajeroLng:        number,
  conductorOrigenLat: number,
  conductorOrigenLng: number,
  conductorDestinoLat: number,
  conductorDestinoLng: number,
  limiteKm: number = 0.5
): boolean => {
  const puntoPasajero = turf.point([pasajeroLng, pasajeroLat]);

  const rutaConductor = turf.lineString([
    [conductorOrigenLng, conductorOrigenLat],
    [conductorDestinoLng, conductorDestinoLat],
  ]);

  const distancia = turf.pointToLineDistance(puntoPasajero, rutaConductor, {
    units: 'kilometers',
  });

  return distancia <= limiteKm;
};

export const filtrarViajesCercanos = (
  viajes: any[],
  pasajeroLat: number,
  pasajeroLng: number,
  limiteKm: number = 0.5
): any[] => {
  return viajes.filter((viaje) => {
    if (
      viaje.latitud_origen   == null || viaje.longitud_origen  == null ||
      viaje.latitud_destino  == null || viaje.longitud_destino == null
    ) return true;

    return estaCercaDeRuta(
      pasajeroLat,
      pasajeroLng,
      viaje.latitud_origen,
      viaje.longitud_origen,
      viaje.latitud_destino,
      viaje.longitud_destino,
      limiteKm
    );
  });
};