1. Disenar modelo de base de datos para orders, su tabla y relaciones
2. Anadir la funcionalidad al menu web para que haga un post o por webhook a supabase, que este se entere y genere una alerta, ademas debe guardar en la base de datos al cliente y si este existe debe actualizar su total en credito
3. Disenar sistema de alertas (notificaciones push y sonido en la app), el header debe tener la campanita y un modal para ver las notificaciones pendientes
4. Disenar vistas de administracion de orders pendientes (Ya hay una vista llamada orders, que en realidad es sales, pero no maneja bien los estados de pendientes y ya finalizadas)
5. mobile/src/app
   ├── \_layout.tsx
   └── (tabs)
   ├── (clients)
   │ └── clients.tsx
   ├── (expenses)
   │ └── expenses.tsx
   ├── index.tsx
   ├── (inventory)
   │ └── inventory.tsx
   ├── \_layout.tsx
   ├── (orders)
   │ └── orders.tsx
   ├── (recipes)
   │ └── recipes.tsx
   └── (reports)
   └── reports.tsx

8 directories, 9 files

mobile/src/features
├── clients
│ ├── components
│ │ └── ClientsScreen.tsx
│ ├── services
│ │ └── clients.service.ts
│ └── types
│ └── client.type.ts
├── expenses
│ ├── components
│ │ ├── ExpenseDetailModal.tsx
│ │ └── ExpensesScreen.tsx
│ ├── services
│ │ └── expense.service.ts
│ └── types
│ └── expense.type.ts
├── menu
│ ├── components
│ │ ├── CartModal.tsx
│ │ ├── MenuHeader.tsx
│ │ ├── MenuProductCard.tsx
│ │ ├── ProductList.tsx
│ │ └── ShareMenuQRModal.tsx
│ ├── hooks
│ │ ├── useCartModal.tsx
│ │ ├── useMenu.tsx
│ │ └── useProductList.tsx
│ └── types
│ └── menu-filter.type.ts
├── products
│ ├── components
│ │ ├── CreateProductModal.tsx
│ │ ├── EditProductModal.tsx
│ │ └── InventoryScreen.tsx
│ ├── helpers
│ │ └── stock-status.helper.ts
│ ├── hooks
│ │ └── useInventory.tsx
│ ├── services
│ │ └── products.service.ts
│ └── types
│ └── product.type.ts
├── recipes
│ ├── components
│ │ ├── CreateRecipeModal.tsx
│ │ ├── MenuRecipeCard.tsx
│ │ └── RecipesScreen.tsx
│ ├── services
│ │ └── recipes.service.ts
│ └── types
│ └── recipe.type.ts
├── resume
│ ├── components
│ │ ├── RangeReportScreen.tsx
│ │ └── ReportsScreen.tsx
│ └── hooks
│ └── useReports.tsx
└── sales
├── components
│ ├── ReasonDialog.tsx
│ ├── SaleCard.tsx
│ ├── SaleDetailModal.tsx
│ ├── SalesHeader.tsx
│ ├── SalesScreen.tsx
│ └── SalesSummaryBar.tsx
├── services
│ └── sales.service.ts
└── types
├── order.type.ts
└── sale.type.ts

35 directories, 44 files
