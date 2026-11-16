# Neon Pong

Juego de Pong para el navegador con estética neón, hecho con HTML, CSS y JavaScript puro, sin dependencias ni paso de compilación.

**Juégalo aquí:** https://hehurove-gif.github.io/PingPong-Web/

## Cómo se juega

Tú controlas la paleta izquierda y la computadora la derecha. El primero en llegar a **5 puntos** gana. Pulsa **Start Game** (o la barra espaciadora) para empezar; al terminar puedes jugar otra partida.

| Control | Acción |
| --- | --- |
| Mouse | Mueve la paleta hacia donde apunta el cursor |
| `↑` / `↓` o `W` / `S` | Sube y baja la paleta |
| Dedo (pantalla táctil) | Arrastra sobre el campo para mover la paleta |
| `Espacio` | Inicia la partida |

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
| `script.js` | Lógica del juego: movimiento de la pelota y las paletas, colisiones, marcador y fin de partida |

## Despliegue

El sitio es estático y se publica con GitHub Pages desde este repositorio.

## Autor

Hecho por [Hetor](https://hetor.hehurove.workers.dev/es).
