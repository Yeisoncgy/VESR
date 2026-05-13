# VESR — Contexto del proyecto

> Este archivo es el handoff entre sesiones de Claude Code. Léelo primero.

## Qué es VESR

VESR es una herramienta web personal para que **Yeison** y su mejor amigo **Jafet** escuchen sets de música (techno/electrónica de YouTube o SoundCloud) **sincronizados en tiempo real**, cada uno desde su dispositivo (móvil o desktop).

**Es solo para ellos dos.** No es producto público. No hay multi-tenant, no hay auth, no hay analytics. Optimizar siempre por "funciona para los dos" sobre generalidad.

**El nombre oficial es VESR** (en código todavía aparece "SYNC" en algunos lugares — pendiente renombrar).

**Idioma de comunicación con el usuario: español.**

## El problema que resuelve

Flujo manual actual: Yeison comparte un link de YouTube/SoundCloud → se ponen de acuerdo por chat en un segundo exacto → ambos le dan play al mismo tiempo. Quieren automatizar la parte de la sincronización.

## Arquitectura (decidida y trabada)

- **Frontend:** Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- **Sync en tiempo real:** Supabase Realtime (broadcast + presence; sin tablas)
- **Reproductores:** YouTube IFrame Player API + SoundCloud Widget API embebidos
- **Hosting:** Vercel (free tier, subdominio `*.vercel.app`)
- **Sync de reloj:** estilo NTP — endpoint `/api/time` retorna `Date.now()` del servidor, cliente mide offset con 5 samples y se queda con el de menor RTT
- **Acciones sincronizadas:** play, pause, seek; play se schedulea con 1500ms de delay para que ambos peers arranquen al mismo `serverStartAt`

## Estética visual

**Dark + neón + visualizer** — vibe club/rave que cuadra con techno.

- Fondo: `#07070a` con radiales suaves cyan + magenta
- Acentos: cyan `#00f0ff`, magenta `#ff2bb5`
- Tipografía: Geist Sans + Geist Mono
- Glow effects en botones primarios y bordes
- Visualizer animado (32 barras CSS) reactivo al estado `playing`
- Gradiente cyan → magenta en la barra de progreso

## Limitación conocida (ya aceptada por el usuario)

En móvil (iOS Safari especialmente), si la pantalla se bloquea o el navegador pasa a background, **el reproductor embebido se pausa**. Es restricción del browser para iframes cross-origin. Para resolverlo bien se necesitaría una app nativa (fuera de scope MVP). Por ahora la regla es: dejar la app abierta y la pantalla prendida.

## Estructura del código

```
src/
  app/
    layout.tsx              # metadata, fonts, viewport
    page.tsx                # landing (server)
    LandingForm.tsx         # cliente: input + crear sala
    globals.css             # tema dark+neón (variables CSS + keyframes)
    r/[id]/
      page.tsx              # cuarto (server, valida searchParams)
      RoomView.tsx          # cliente: orquesta player + sync
    api/time/route.ts       # endpoint para NTP-style clock sync
  components/
    players/
      YouTubePlayer.tsx     # wrapper IFrame API con PlayerHandle
      SoundCloudPlayer.tsx  # wrapper Widget API con misma PlayerHandle
    Visualizer.tsx          # barras animadas CSS
    CopyLinkButton.tsx      # copia URL al clipboard
  lib/
    sources.ts              # parseSourceUrl(): YouTube + SoundCloud
    room-id.ts              # nanoid 6 chars sin ambigüedad
    supabase.ts             # cliente con isSupabaseConfigured flag
    clock.ts                # measureClock, nowServer, serverToLocal
    sync-events.ts          # tipos SyncEvent
    useRoomSync.ts          # hook: presence + broadcast + apply
```

### Cómo viajan los datos

- **Landing → cuarto:** el source URL viaja en query params (`/r/<id>?src=<encoded>&t=<type>`). No hay DB de salas. Yeison comparte la URL completa con Jafet.
- **Sala (canal):** Supabase channel `room:<id>` con `broadcast { self: false }` + `presence { key: peerId }`.
- **Identidad:** `peerId` se genera una vez por tab (nanoid 8 chars en `useRoomSync.ts`). No persiste.

### Flujo de play sincronizado

1. Ambos peers entran al cuarto, se ven en `presence`
2. Cada uno toca **"Estoy listo"** → gesture para autoplay móvil + `setReady(true)` en presence
3. Cuando ambos tienen `ready: true`, el botón **"Play"** se habilita
4. Quien lo presione → `broadcastPlay(position, 1500ms)` → calcula `serverStartAt = nowServer() + 1500`
5. Cada peer (incluyendo el sender, vía `setTimeout` local) hace seek a `position` y schedulea `play()` en `serverStartAt - offset`
6. Late join: al subscribirse, el peer manda `state-request` → quien esté reproduciendo responde con `state` (posición + server time)

## Estado actual del build

**Completo y funcionando en `localhost:3000`:**
- Scaffold Next.js + dependencias (`@supabase/supabase-js`, `nanoid`)
- Landing con detección de URL y creación de sala
- Cuarto con player embebido (YouTube IFrame + SoundCloud Widget unificados por `PlayerHandle`)
- Controles: play/pausa, ±10s, scrub en barra de progreso
- Visualizer animado
- Botón de copiar link
- Lógica de sync completa en código (broadcast + presence + clock offset)
- Gracefully degrades: si Supabase no está configurado muestra "sin sync"

**Pendiente — bloqueante:**
- **Yeison tiene que crear cuenta en Supabase** y meter las keys en `.env.local`. Sin esto la sincronización entre dispositivos no funciona (cada player es independiente). Ya hay `.env.local.example` con el formato.

**Pendiente — después de Supabase:**
- Test E2E real con 2 dispositivos (desktop + iPhone/Android)
- Init git + primer commit
- Push a GitHub
- Deploy a Vercel + variables de entorno en Vercel
- Mobile QA (autoplay flow, viewport, touch targets)
- Renombrar "SYNC" → "VESR" en el código y metadata
- Diseño visual: Yeison va a generar mockups con Claude Design — cuando vuelva con ellos, hay que adaptar la UI actual

## Cómo retomar la sesión (paso a paso)

### Si Yeison ya tiene las keys de Supabase

1. Crear `.env.local` en la raíz copiando de `.env.local.example`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   ```
2. Reiniciar `npm run dev`
3. Abrir `localhost:3000` en una ventana y `192.168.0.13:3000` (o el IP local) en otra (o en celu en la misma WiFi)
4. Crear sala, copiar URL, abrirla en la otra → ambos deberían ver "compa aquí" → tocar "Estoy listo" → "compa listo" → un peer presiona Play → ambos arrancan sincronizados

### Si todavía no tiene las keys

Guía a Yeison por:
1. `https://supabase.com` → "Start your project" → signup con GitHub o Google
2. "New Project" → cualquier nombre, password generada, región South America (São Paulo) o East US, plan Free
3. Esperar ~1 min provisión
4. **Project Settings** → **API Keys** → copiar "Project URL" y "anon public" key
5. Pegarlas en `.env.local`

**No hace falta crear tablas.** Realtime broadcast + presence funcionan sin schema.

## Comandos útiles

```bash
# desde C:\Users\yeiso\Projects\sync-music-app
npm run dev          # dev server con Turbopack en :3000
npm run build        # build de prod
npx tsc --noEmit     # type check
npm run lint         # eslint
```

## Decisiones de producto guardadas

- **No Spotify.** Requiere Premium en ambas cuentas + Web Playback SDK. Fuera de scope.
- **No app nativa.** Web app con PWA basta. La limitación de pantalla bloqueada es aceptada.
- **URL self-contained.** El source viaja en query params, no en DB. Si más adelante queremos URLs cortas (sin el query gigante), Supabase tiene base de datos lista — pero no es necesario.
- **El botón "Estoy listo"** existe por dos razones: (1) gesture de usuario para que el navegador permita autoplay programático en móvil, (2) coordinar arranque (nadie le da play hasta que el otro esté listo).

## Estética — paleta exacta (en `globals.css`)

```css
--background: #07070a
--surface: #0e0e13
--surface-2: #14141c
--border: #1d1d28
--foreground: #ededed
--muted: #8a8a99
--cyan: #00f0ff
--magenta: #ff2bb5
```

## Reglas para Claude

- **Idioma:** español al usuario.
- **Tono:** directo, recomendaciones concretas con tradeoffs, no listas abiertas.
- **No proyectos en OneDrive.** Default a `C:\Users\yeiso\Projects\<nombre>`.
- **No documentation extra** salvo que el usuario la pida (este archivo es la excepción porque él lo pidió explícitamente).
- **No over-engineer.** Es app para 2 personas. Sin auth, sin escalabilidad, sin features hipotéticos.
- **Mobile-first.** El usuario va a usar esto desde iPhone y Android tanto como desde desktop.
