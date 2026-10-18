# Sabor Espress · Demo

Demo web de un bar: home, carta, carrito, pedido y página "Sobre nosotros". Todo con datos mock, sin backend.

```bash
npm install
npm run dev
```

- `/` inicio · `/menu` carta · `/about-us` · `/mesa/5` abre la home recordando la mesa (el pedido se hace "en mesa #5")
- Los datos del menú están en `src/services/mock-data.ts`; el envío del pedido se simula en `src/services/order.service.ts`.
- Datos del bar (dirección, teléfono, horarios) en `src/config/bar.ts`.
