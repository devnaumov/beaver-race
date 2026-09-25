# Beaver Race

Интерактивная 3D-гонка бобров на Vite, React, Effect 4, Effect Atom, XState и Three.js.

## Запуск

```bash
npm install
npm run dev
```

Проверка production-сборки:

```bash
npm run build
npm test
npm run preview
```

## Архитектура

- `src/gameMachine.ts` содержит основное состояние игры, countdown actor и simulation actor XState.
- `src/store.ts` запускает machine actor и синхронизирует snapshot с Effect Atom.
- `src/race/` содержит классы фаз темпа, генератор плана и непрерывные траектории гонки.
- `src/three/beaver/` содержит базовую модель, части тела, аксессуары, аниматор и представление участника.
- `src/three/environment/` содержит классы неба, облаков, реки, берегов, леса, дорожки, флагов, фонового поединка и разрываемой финишной ленты.
- `src/three/BeaverRaceScene.ts` компонует Three.js runtime, связывает его с actor и управляет постановочными планами камеры по ходу гонки.
- React-компоненты читают Effect Atom; локальные `useState` и `useEffect` не используются.

Источники SVG-логотипов перечислены в `THIRD_PARTY_ASSETS.md`.
