import { describe, it, expect } from "vitest";

import {
  esCorreoInstitucional,
  formatearMensajeChat,
  filtrarViajesDisponibles,
} from "../../src/utils/unitHelpers";

describe("Pruebas unitarias", () => {
  it("valida correo institucional correctamente", () => {
    expect(
      esCorreoInstitucional("l23120478@morelia.tecnm.mx")
    ).toBe(true);

    expect(
      esCorreoInstitucional("usuario@gmail.com")
    ).toBe(false);
  });

  it("formatea mensajes del chat correctamente", () => {
    const mensaje = {
      id_mensaje: 10,
      contenido: "Hola",
      id_emisor: "user-1",
      emisor: {
        nombre: "Angel",
      },
    };

    const resultado = formatearMensajeChat(
      mensaje,
      "user-1"
    );

    expect(resultado).toEqual({
      id: "10",
      texto: "Hola",
      remitente: "yo",
      nombre: "Angel",
    });
  });

  it("filtra viajes disponibles correctamente", () => {
    const viajes = [
      {
        id_viaje_pub: 1,
        asientos_disponibles: 3,
        conductor: {
          usuario: {
            id_usuario: "user-1",
          },
        },
      },
      {
        id_viaje_pub: 2,
        asientos_disponibles: 2,
        conductor: {
          usuario: {
            id_usuario: "user-2",
          },
        },
      },
      {
        id_viaje_pub: 3,
        asientos_disponibles: 0,
        conductor: {
          usuario: {
            id_usuario: "user-3",
          },
        },
      },
    ];

    const resultado = filtrarViajesDisponibles(
      viajes,
      "user-1"
    );

    expect(resultado).toHaveLength(1);

    expect(resultado[0].id_viaje_pub).toBe(2);
  });
});