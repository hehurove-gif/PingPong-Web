# Neon Pong

Juego de Pong para el navegador con estética neón, hecho con HTML, CSS y JavaScript puro, sin dependencias ni paso de compilación.

**Juégalo aquí:** https://hehurove-gif.github.io/PingPong-Web/

## Cómo se juega

Tú controlas la paleta izquierda y la computadora la derecha. El primero en llegar a **5 puntos** gana. Elige una dificultad, pulsa **Start Game** (o la barra espaciadora) y juega; al terminar puedes jugar otra partida.

### Niveles de dificultad

| Nivel | Paletas | Pelota | Computadora |
| --- | --- | --- | --- |
| Easy | Grandes | Lenta, acelera poco | Lenta y poco precisa; empieza a seguir la pelota tarde |
| Normal | Medianas | Velocidad media | Equilibrada |
| Hard | Más chicas | Rápida | Rápida y precisa |
| Insane | Chicas | Muy rápida, acelera más en cada golpe | Casi perfecta, sigue la pelota todo el tiempo |

El nivel elegido se recuerda en tu navegador, igual que tu récord por nivel (victorias, derrotas y mejor racha). No se sube a ningún servidor.

### Controles

| Control | Acción |
| --- | --- |
| Mouse | Mueve la paleta hacia donde apunta el cursor |
| `↑` / `↓` o `W` / `S` | Sube y baja la paleta |
| Dedo (pantalla táctil) | Arrastra sobre el campo para mover la paleta |
| `Espacio` | Inicia la partida o la reanuda |
| `P` o `Esc` | Pausa y reanuda (también se pausa sola si cambias de pestaña) |
| `1` `2` `3` `4` | Elige Easy, Normal, Hard o Insane (antes de empezar) |
| `M` | Activa o silencia el sonido |

Además tiene efectos de sonido generados en el navegador, estela en la pelota y una pequeña sacudida de pantalla al anotar.

## Ejecutar localmente

No necesita instalación. Abre `index.html` en cualquier navegador moderno, o sirve la carpeta con un servidor estático:

```bash
python -m http.server 8000
```

y visita `http://localhost:8000`.

## Estructura

| Archivo | Contenido |
| --- | --- |
| `index.html` | Estructura de la página: marcador, canvas del juego y ayuda de controles |
| `style.css` | Estilos y efecto neón |
| `script.js` | Lógica del juego: niveles de dificultad, inteligencia de la computadora, colisiones, marcador, récords, pausa y sonido |

## Despliegue

El sitio es estático y se publica con GitHub Pages desde este repositorio.

## Autor

Hecho por [Hetor](https://hetor.hehurove.workers.dev/es).
