# Third-party visual assets

- PostgreSQL, MySQL, SQLite, MongoDB, Redis, ClickHouse, MariaDB and DBeaver marks are sourced from [Simple Icons](https://simpleicons.org/) through the `simple-icons` npm package (CC0-1.0; individual marks remain trademarks of their owners).
- The Oracle icon geometry is sourced from the Oracle mark published by [VectorLogoZone](https://www.vectorlogo.zone/logos/oracle/oracle-icon.svg).
- The CloudBeaver flag uses the official `product-logo_light.svg` from the [DBeaver CloudBeaver repository](https://github.com/dbeaver/cloudbeaver).

The marks are used only to identify database drivers and the two fictional race teams.

## Character and animation

- The beaver mesh, skeleton, skin weights and 31 equipment models are original procedural geometry authored for this project, in `src/three/beaver/`. No externally licensed beaver model is required.
- The run cycle is adapted from **Running** in [RobotExpressive.glb](https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf/RobotExpressive), originally by **Quaternius (Tomás Laulhé)**, licensed **[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)**. The upstream [README](https://github.com/mrdoob/three.js/blob/dev/examples/models/gltf/RobotExpressive/README.md) confirms the license; the GLB conversion and modifications are by Don McCurdy.
- `src/three/beaver/running.json` contains the 24-frame, eight-track derivative motion, the upstream URL and the SHA-256 of the source GLB. `scripts/import-running.mjs` extracts animated joint directions and projects them onto the beaver's sagittal plane; `BeaverAnimator.ts` adapts the stride to short limbs and blends it with idle. Root translation, robot meshes, facial morphs and the source robot's dimensions are not used.
- To regenerate motion: `node scripts/import-running.mjs [path/to/RobotExpressive.glb]`. Omitting the path downloads the source. The game itself never downloads the robot or animation at runtime.
