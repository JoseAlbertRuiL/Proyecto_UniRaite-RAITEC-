const vision = require('@google-cloud/vision');
const path = require('path');

const client = new vision.ImageAnnotatorClient({
  keyFilename: path.join(__dirname, '../google-key.json')
});

const extraerTextoDeImagen = async (rutaAbsolutaImagen) => {
  try {
    const [resultado] = await client.textDetection(rutaAbsolutaImagen);
    const anotaciones = resultado.textAnnotations;
    
    if (anotaciones.length > 0) {
      return anotaciones[0].description.toUpperCase();
    }
    return "";
  } catch (error) {
    console.error("Error en Vision API:", error.message);
    throw new Error("Fallo al comunicarse con Google Cloud Vision");
  }
};

module.exports = { extraerTextoDeImagen };