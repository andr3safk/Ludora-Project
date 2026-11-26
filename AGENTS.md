# Ludora: contexto del proyecto

## Qué es
Ludora es una app web responsive (mobile-first) para llevar un diario de los videojuegos
que juegas durante el año, con reseñas, calificaciones, estadísticas y un resumen anual
estilo "Wrapped". A futuro se sumarán películas y series con la misma estructura, por eso
el modelo de datos usa una entidad genérica "Entrada" con un campo `tipo`.
Referencias de producto: Letterboxd, Backloggd, Grouvee.

## Stack (versiones reales instaladas)
- Next.js 16 (App Router, `src/`), React 19, TypeScript 5.9, Tailwind CSS 4
- UI: shadcn/ui sobre Base UI, preset Maia, iconos Hugeicons
- Backend: Next.js (route handlers y server actions)
- Base de datos y auth: Supabase (Postgres + Auth) con `@supabase/ssr`
- ORM: Drizzle (`drizzle-orm`, `drizzle-kit`), validación con Zod 4
- Gráficas: Recharts
- Tests: Vitest (unitarios, solo en `src/**/*.test.ts(x)`), Playwright (E2E en `tests/`)
- API de juegos: RAWG (solo desde el servidor, con caché)
- Gestor de paquetes: **pnpm 11** únicamente (nunca npm ni yarn). Node 24.
- Entorno local: Arch Linux, shell zsh.
- Presupuesto: $0, solo planes gratuitos. Antes de proponer un servicio nuevo, confirma
  que tiene plan gratis y qué límites tiene.

## Estructura
src/app (rutas), src/components/ui (shadcn), src/features/{diary,games-search,stats},
src/lib/{db,supabase,rawg}, src/types, tests/ (Playwright).

## Reglas de trabajo (obligatorias)
1. Idioma: responde en español. El código, nombres de variables y commits en inglés o
   español neutro, pero consistente con lo existente.
2. Antes de dar algo por terminado, ejecuta `pnpm check` (lint + typecheck + test + build)
   y corrige hasta que pase. Nunca digas "listo" sin haberlo corrido.
3. Cambios pequeños y enfocados, uno por historia de Jira. No refactorices cosas que no
   se pidieron.
4. No instales dependencias nuevas sin explicar para qué y pedir confirmación.
5. Nunca subas ni imprimas secretos. Las claves viven en `.env.local` (ignorado por git).
   `.env.example` sí se versiona, sin valores. `RAWG_API_KEY` y `DATABASE_URL` jamás
   llevan el prefijo `NEXT_PUBLIC_`.
6. No hagas push, merge ni cambios en `main` o `develop`. Trabaja en la rama actual
   (`feature/LP-XX-descripcion`). No hagas `git push` salvo que te lo pida explícitamente.
7. Commits en formato `tipo(LP-XX): mensaje` (feat, fix, chore, docs, test, refactor).
8. Siempre cubre estados de carga, vacío y error, y verifica que la UI funcione en móvil
   y escritorio. Accesibilidad básica: teclado, contraste, etiquetas.
9. Si algo es ambiguo o hay varias opciones, pregunta antes de decidir.

## Notas técnicas que ya nos costaron un error
- pnpm 11 guarda la aprobación de build scripts en `pnpm-workspace.yaml` (`allowBuilds`),
  no en `package.json`. Debe incluir `esbuild: true`.
- `packageManager` se declara solo en `package.json`; el workflow de CI NO debe repetir
  la versión de pnpm.
- `LayoutProps`, `PageProps` y `RouteContext` son tipos globales generados por Next:
  el script `typecheck` debe ser `next typegen && tsc --noEmit`.
- Vitest no debe tocar `tests/` (es de Playwright).
- `.gitignore` ignora `.env*`: debe existir la excepción `!.env.example`.
- El perfil público `/@usuario` requiere un `rewrite` en `next.config.ts` hacia
  `/u/[username]` (las carpetas con `@` son slots en Next).

## Plan del producto (Jira, prefijo LP)
Fase 1 (MVP): fundamentos y CI, auth, catálogo/búsqueda de juegos, diario, reseñas.
Luego: sesiones de juego, metas anuales, estadísticas y resumen anual, perfil público.
Fase 2: listas, social, importaciones (Steam/CSV), PWA. Fase 3: películas y series.
Prioridad actual: cerrar la Épica 1 (repo, CI/CD, modelo de datos, sistema de diseño).
