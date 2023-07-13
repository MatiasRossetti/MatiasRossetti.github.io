let caminante1, caminante2, caminante3;
let trazo = 6; // Grosor de las líneas
let capa1, capa2, capa3;
let centroX, centroY; // Posición del centro de la pantalla
let analyser;
let contador;

// Función para interpolar ángulos
function lerpAngle(start, end, amount) {
  let difference = end - start;
  while (difference < -PI) difference += TWO_PI;
  while (difference > PI) difference -= TWO_PI;
  return start + difference * 2 * amount;
}

function setup() {
  createCanvas(800, 800);
  background(218, 223, 201); // Cambiar color de fondo

  centroX = width / 2;
  centroY = height / 2;

  // Crear las capas
  capa1 = createGraphics(width, height);
  capa2 = createGraphics(width, height);
  capa3 = createGraphics(width, height);

  // Crear los caminantes con posiciones iniciales en las esquinas del lienzo
  let esquinas = [
    { x: 0, y: 0 }, // Esquina superior izquierda
    { x: width, y: 0 }, // Esquina superior derecha
    { x: width, y: height }, // Esquina inferior derecha
    { x: 0, y: height }, // Esquina inferior izquierda
  ];

  let caminanteIndex = floor(random(0, esquinas.length));
  let caminantePos = esquinas[caminanteIndex];

  caminante1 = new Caminante(
    caminantePos.x,
    caminantePos.y,
    capa1,
    color(20, 38, 32, 5)
  );

  esquinas.splice(caminanteIndex, 1); // Eliminar la esquina ya utilizada

  caminanteIndex = floor(random(0, esquinas.length));
  caminantePos = esquinas[caminanteIndex];

  caminante2 = new Caminante(
    caminantePos.x,
    caminantePos.y,
    capa2,
    color(120, 168, 162, 5)
  );

  esquinas.splice(caminanteIndex, 1); // Eliminar la esquina ya utilizada

  caminanteIndex = floor(random(0, esquinas.length));
  caminantePos = esquinas[caminanteIndex];

  caminante3 = new Caminante(
    caminantePos.x,
    caminantePos.y,
    capa3,
    color(209, 212, 70, 4)
  );

  // Ajustar la tensión de las curvas
  curveTightness(-3);

  // Iniciar la captura de audio
  iniciarCapturaAudio();

  // Iniciar el contador a 0
  contador = 0;
}

function draw() {
  // Actualizar caminantes según el nivel de volumen de graves y agudos
  let nivelGraves = obtenerNivelGraves();
  let nivelAgudos = obtenerNivelAgudos();

  let movioCaminantes = false; // Bandera para verificar si los caminantes se mueven

  let umbralMinimo = 0.18;
  if (nivelGraves > umbralMinimo && nivelAgudos < umbralMinimo) {
    caminante2.actualizar(nivelGraves);
    caminante3.actualizar(nivelGraves);
    movioCaminantes = true;
  }
  if (nivelAgudos > umbralMinimo) {
    caminante1.actualizar(nivelAgudos);
    movioCaminantes = true;
  }

  if (movioCaminantes) {
    contador++; // Incrementar el contador si los caminantes se mueven
  }

  // Dibujar capas
  capa1.clear();
  capa1.blendMode(BLEND); // Restaurar el modo de mezcla predeterminado
  capa1.stroke(20, 38, 32);
  capa1.strokeWeight(trazo);
  capa1.noFill();
  caminante1.dibujar(capa1);

  capa2.clear();
  capa2.blendMode(BLEND);
  capa2.stroke(120, 168, 162);
  capa2.strokeWeight(trazo);
  capa2.noFill();
  caminante2.dibujar(capa2);

  capa3.clear();
  capa3.blendMode(BLEND);
  capa3.stroke(209, 212, 70);
  capa3.strokeWeight(trazo);
  capa3.noFill();
  caminante3.dibujar(capa3);

  // Dibujar capas en el lienzo principal
  image(capa3, 0, 0);
  image(capa2, 0, 0);
  image(capa1, 0, 0);

  // // Mostrar el valor del contador en la pantalla
  // fill(0);
  // textSize(20);
  // textAlign(LEFT, TOP);
  // text("Contador: " + contador, 10, 10);

  // Reiniciar el programa si el contador alcanza los 15 segundos
  if (contador >= 25 * 60) {
    setup();
  }

  // Continuar la animación
  requestAnimationFrame(draw);
}

class Caminante {
  constructor(x, y, capa, color) {
    this.x = x;
    this.y = y;
    this.direccion = random(TWO_PI);
    this.nuevaDireccion = this.direccion;
    this.velocidad = 25; // Aumentar la velocidad
    this.historia = [];
    this.capa = capa;
    this.trazo = trazo; // Grosor del trazo
    this.color = color; // Cambiar color y opacidad
  }

  dibujar() {
    this.capa.beginShape();
    for (let i = 0; i < this.historia.length; i++) {
      let punto = this.historia[i];
      this.capa.curveVertex(punto.x, punto.y);
    }
    this.capa.endShape();
  }

  actualizar(nivelVolumen) {
    // Calcular siguiente posición
    let pasoX = cos(this.direccion) * this.velocidad * nivelVolumen;
    let pasoY = sin(this.direccion) * this.velocidad * nivelVolumen;
    let nuevaX = this.x + pasoX;
    let nuevaY = this.y + pasoY;

    // Verificar si está cerca de los bordes
    let margen = 50; // Margen de proximidad al borde

    if (
      nuevaX < margen ||
      nuevaX > width - margen ||
      nuevaY < margen ||
      nuevaY > height - margen
    ) {
      // Cambiar dirección hacia el centro de la pantalla
      let anguloHaciaCentro = atan2(centroY - nuevaY, centroX - nuevaX);
      this.nuevaDireccion = anguloHaciaCentro;
    } else {
      // Cambiar dirección aleatoriamente
      if (random() < 0.1) {
        this.nuevaDireccion = random(TWO_PI);
      }
    }

    // Interpolar hacia la nueva dirección
    this.direccion = lerpAngle(this.direccion, this.nuevaDireccion, 0.09);

    // Actualizar posición
    this.x = nuevaX;
    this.y = nuevaY;

    // Verificar si está dentro del cuadrado
    let cuadradoX = 0; // Posición X del cuadrado
    let cuadradoY = 0; // Posición Y del cuadrado
    let cuadradoLado = width; // Lado del cuadrado

    if (this.x < cuadradoX) {
      this.x = cuadradoX;
    } else if (this.x > cuadradoX + cuadradoLado) {
      this.x = cuadradoX + cuadradoLado;
    }

    if (this.y < cuadradoY) {
      this.y = cuadradoY;
    } else if (this.y > cuadradoY + cuadradoLado) {
      this.y = cuadradoY + cuadradoLado;
    }

    // Agregar punto a la historia
    if (
      this.historia.length === 0 ||
      this.x !== this.historia[this.historia.length - 1].x ||
      this.y !== this.historia[this.historia.length - 1].y
    ) {
      this.historia.push({ x: this.x, y: this.y });
    }
  }
}

// Función para iniciar la captura de audio
function iniciarCapturaAudio() {
  // Verificar si el navegador es compatible con getUserMedia
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    // Configuración para capturar solo audio
    const constraints = { audio: true, video: false };

    // Solicitar permiso para acceder al micrófono
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(function (stream) {
        // Crear un nuevo objeto AudioContext
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Crear un nodo Analyser para obtener datos del audio
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;

        // Conectar el nodo Analyser al flujo de audio
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        // Iniciar la animación
        requestAnimationFrame(draw);
      })
      .catch(function (error) {
        console.error('Error al acceder al micrófono:', error);
      });
  } else {
    console.error('El navegador no es compatible con getUserMedia');
  }
}

// Función para obtener el nivel de volumen de los graves
function obtenerNivelGraves() {
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);

  const inicio = 0;
  const fin = Math.floor(bufferLength * 0.2); // Rango de frecuencias graves

  let suma = 0;
  for (let i = inicio; i < fin; i++) {
    suma += dataArray[i];
  }

  const promedio = suma / (fin - inicio);
  const nivel = promedio / 255; // Normalizar el nivel entre 0 y 1

  return nivel;
}

// Función para obtener el nivel de volumen de los agudos
function obtenerNivelAgudos() {
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);

  const inicio = Math.floor(bufferLength * 0.7); // Rango de frecuencias agudas
  const fin = bufferLength;

  let suma = 0;
  for (let i = inicio; i < fin; i++) {
    suma += dataArray[i];
  }

  const promedio = suma / (fin - inicio);
  const nivel = promedio / 255; // Normalizar el nivel entre 0 y 1

  return nivel;
}

// Iniciar el programa
setup();
