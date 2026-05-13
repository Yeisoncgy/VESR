# VESR

App web personal para escuchar sets de YouTube/SoundCloud **sincronizados en tiempo real** desde dos dispositivos. Hecha para [@Yeisoncgy](https://github.com/Yeisoncgy) y su parche.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind v4
- Supabase Realtime (broadcast + presence, sin tablas)
- YouTube IFrame API + SoundCloud Widget API
- Deploy: Vercel

## Cómo funciona

1. Pegas un link de YouTube/SoundCloud → se crea una sala con un ID corto.
2. Compartes la URL con tu compa.
3. Ambos tocan **"Estoy listo"** (gesture necesario para autoplay móvil).
4. Cualquiera presiona **Play** → ambos arrancan al mismo `serverStartAt` con 1500 ms de scheduling.
5. Sync de reloj estilo NTP vía `/api/time` (5 samples, se queda con el de menor RTT).

## Desarrollo local

```bash
cp .env.local.example .env.local
# rellenar NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev
```

`http://localhost:3000`.

## Limitación conocida

En móvil, si la pantalla se bloquea o el navegador pasa a background, el iframe se pausa (restricción del browser). Mantén la app abierta y la pantalla prendida.
