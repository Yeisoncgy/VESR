# Prompt para Claude Design — VESR

> Copia el bloque de abajo y pégalo en una conversación nueva con Claude (en claude.ai, idealmente con artifacts activado). Te va a generar un mockup HTML+Tailwind interactivo que puedes ver, comparar y refinar pidiéndole ajustes después.

---

```
Necesito que diseñes la interfaz de una web app llamada **VESR**.

## Qué es VESR
Una herramienta web personal para que dos amigos (yo y mi mejor amigo Jafet) escuchemos música electrónica/techno sincronizada en tiempo real. Yo pego un link de YouTube o SoundCloud, le mando la URL de la sala a Jafet, ambos abrimos la URL en nuestros dispositivos, ambos tocamos "Estoy listo", y un solo botón "Play" arranca el set sincronizadamente en los dos dispositivos a la vez. La app también sincroniza pausa, seek y rewind.

**Audiencia:** literalmente nosotros dos. No es producto público. No hay login. La sala se identifica por la URL.

## Dirección estética
Dark + neón + visualizer. Vibe club / rave underground / techno minimalista, pero refinado — no kitsch, no años 90. Pensar Boris Brejcha + Berghain + Linear + Spotify dark mode.

**Paleta:**
- Background: `#07070a` (negro profundo)
- Surface (cards): `#0e0e13`
- Surface 2 (inputs): `#14141c`
- Borders sutiles: `#1d1d28`
- Texto: `#ededed`
- Muted: `#8a8a99`
- **Cyan neón principal:** `#00f0ff`
- **Magenta neón acento:** `#ff2bb5`

**Tipografía:** Geist Sans para todo (puedes usar Inter como fallback). Mono solo para timestamps y código de sala (Geist Mono o JetBrains Mono).

**Texturas/efectos:**
- Glow suave alrededor de botones primarios y bordes activos (box-shadow con el color cyan)
- Gradientes radiales muy sutiles en el fondo (cyan top-left + magenta bottom-right, opacidad ~8%)
- Letras grandes en mayúsculas con tracking amplio para labels (10–12px, uppercase, letter-spacing 0.2em)
- Transiciones suaves (200–400ms) en hovers
- Sensación de "todo respira" — pulse glow muy lento en indicadores de estado

## Pantallas que necesito

### 1. Landing (`/`)
- Hero centrado vertical en mobile y desktop
- Logo/marca: la palabra **VESR** grande, peso black, cyan con glow
- Tagline corta abajo: "Escucha música al tiempo con tu compa"
- Una sola card central (glassmorphism muy sutil sobre el background) con:
  - Label pequeño en uppercase: "Link del set"
  - Un input grande para pegar URL
  - Badge dinámico dentro del input que aparece cuando la URL es válida: "YouTube" en magenta o "SoundCloud" en cyan
  - Botón gigante cyan con glow: "Crear sala"
- Footer pequeño con un disclaimer tipo "tu sala · tu música · tu parche"
- Arriba: badge sutil "beta · solo para Yeison & Jafet" con un dot pulsante

### 2. Sala / Reproductor (`/r/[id]`)
**Header:**
- A la izquierda: link "← VESR" pequeño en uppercase
- Centro/derecha: indicador de presencia ("solo tú" gris / "compa aquí" magenta / "compa listo" cyan) + código de sala en mono cyan tracking amplio
- Indicador de precisión de sync abajo del header tipo "±42ms" en muy chico

**Card central (lo principal):**
- Embed del reproductor (16:9 para YouTube, cuadrado para SoundCloud) ocupando todo el ancho del card
- Debajo del embed: barra de progreso delgada con gradiente cyan→magenta, glow sutil, clickeable para hacer seek
- Tiempos a los lados de la barra en mono: `12:34` izquierda, `45:00` derecha
- Controles centrados grandes (especialmente en mobile): botón rewind -10s, botón **PLAY/PAUSA** gigante cyan circular con glow, botón forward +10s
- Estado del botón Play cambia: "Cargando…" → "Estoy listo" → "Esperando a tu compa" / "Play" / "Pausa"
- Visualizer abajo: 32 barras delgadas con gradiente cyan→magenta animadas, bailan cuando hay play, se quedan quietas al 15% de altura en pausa

**Card secundaria (debajo):**
- Label: "Invita a tu compa"
- Caja que muestra la URL completa de la sala con un botón "Copiar" a la derecha
- Cuando se copia: el botón se vuelve cyan brevemente y dice "¡Copiado!"

### 3. Estados especiales
- **Cargando:** el botón principal dice "Cargando…" en muted
- **Solo tú:** dot gris, label "solo tú", botón Play deshabilitado, mensaje sutil "esperando que se conecte tu compa"
- **Compa aquí pero no listo:** dot magenta, "compa aquí", botón muestra "Esperando a tu compa"
- **Ambos listos:** dot cyan brillante, "compa listo", botón Play habilitado y con pulse glow
- **Reproduciendo:** barras del visualizer animadas, botón es "Pausa"
- **Sin Supabase configurado:** banner sutil magenta abajo "⚠ Falta configurar el servidor de sincronización"

## Comportamiento responsive
- **Mobile-first.** Diseña primero para iPhone (375px). El reproductor y los botones deben ser cómodos para dedo. Tap targets de mínimo 44×44px.
- **Desktop:** centra todo en max-width ~600–680px, no estires. La app se siente como una "tarjeta de música" enfocada, no como un dashboard.

## Limitaciones técnicas que el diseño debe respetar
- El reproductor está dentro de un iframe (no puedo customizar lo que se ve adentro), así que diseña los controles **fuera** del iframe, abajo
- No hay visualizer real reactivo al audio (cross-origin iframe lo prohíbe) — las barras son CSS animations en bucle
- El botón "Estoy listo" es un gate inevitable por restricciones de autoplay en móvil — no se puede saltar

## Entregable que quiero
Generá un **único artifact HTML autocontenido** con Tailwind CDN, que muestre:
1. La landing
2. La sala en estado "solo tú"
3. La sala en estado "compa listo + reproduciendo"

Que se puedan navegar como tabs o secciones apiladas. Incluí el visualizer animado con CSS keyframes y los glows con `box-shadow`. Tipografía via Google Fonts (Geist o Inter).

Mantenelo elegante. Si tenés que elegir entre "más adornado" o "más simple", **simple**. Quiero que se sienta caro, no decorado.
```

---

## Tips para iterar con el resultado

Cuando Claude te devuelva el mockup, prueba pedidos como:

- "Hacé el botón Play más grande en mobile, que ocupe ancho casi completo"
- "El visualizer está muy abajo, súbelo más cerca del reproductor"
- "Probá una variante donde el código de sala sea el elemento más prominente del header"
- "Mostrame una segunda paleta donde el acento principal sea magenta en vez de cyan"
- "Diseñame la pantalla de error cuando el link no es válido"

Cuando tengas el diseño final, copialo a esta sesión de Claude Code para adaptar la implementación a los detalles visuales que elijas.
