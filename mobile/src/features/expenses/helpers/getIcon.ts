const EXPENSE_ICONS: Record<string, any> = {
  Pollos: "fast-food-outline",
  "Cerdo & Picadas": "nutrition-outline",
  "Embutidos (Buti/Chorizo)": "restaurant-outline",
  Bebidas: "water-outline",
  "Cervezas / Alcohol": "beer-outline",
};

export function getIcon(categoryName: string): any {
  return EXPENSE_ICONS[categoryName] ?? "pricetag-outline";
}
