export function isFreePlan(plan: {
  isFree?: boolean;
  id?: string;
  type?: string;
  priceAmount?: number;
  price?: string;
} | null | undefined): boolean {
  if (!plan) return false;
  if (plan.isFree === true) return true;
  if (plan.type === "free") return true;
  const id = String(plan.id || "");
  if (id === "free" || id === "plan_free" || id.endsWith("-free")) return true;
  if (typeof plan.priceAmount === "number" && plan.priceAmount === 0) return true;
  const price = String(plan.price || "").replace(/,/g, "").toLowerCase();
  return price.includes("₦0") || price === "0" || price.includes("free");
}
