export function calculateCalorieGoal({ gender, weight, height, age, objective }) {
  const basalRate = gender === 'Hombre'
    ? 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)
    : 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);

  let goal = basalRate * 1.2;
  if (objective === 'perder') goal -= 500;
  if (objective === 'ganar') goal += 500;

  return Math.round(goal);
}

export function calculateNutritionTotals(items = []) {
  return items.reduce((totals, item) => ({
    calories: totals.calories + Number(item.calorias_totales || 0),
    grams: totals.grams + Number(item.gramos_totales || 0),
    protein: totals.protein + Number(item.macronutrientes?.proteinas_g || 0),
    carbohydrates: totals.carbohydrates + Number(item.macronutrientes?.carbohidratos_g || 0),
    fat: totals.fat + Number(item.macronutrientes?.grasas_g || 0),
  }), { calories: 0, grams: 0, protein: 0, carbohydrates: 0, fat: 0 });
}

export function parseIngredients(value) {
  if (!value) return [];
  try {
    const ingredients = JSON.parse(value);
    return Array.isArray(ingredients) ? ingredients : [];
  } catch {
    return [];
  }
}
