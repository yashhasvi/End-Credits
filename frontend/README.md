# End Credits Web

The Angular client for [END CREDITS](../README.md), a cinema identity and
social discovery platform.

## Local development

```bash
npm ci
npm start
```

The development client runs at `http://localhost:4200` and expects the Spring
Boot API at `http://localhost:8080`.

## Checks

```bash
npm test -- --watch=false
npm run build
```

For the full product overview, architecture, API notes, and backend setup, see
the [root README](../README.md).
