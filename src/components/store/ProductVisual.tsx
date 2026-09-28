import grainImage from "@/assets/grocery-grains.jpg";
import householdImage from "@/assets/grocery-household.jpg";
import snacksImage from "@/assets/grocery-snacks.jpg";

const householdWords = ["soap", "detergent", "clean", "brush", "paste", "shampoo", "care", "battery", "stationery", "broom", "utility", "diaper", "razor", "sanitary"];
const snackWords = ["snack", "namkeen", "biscuit", "cookie", "chocolate", "toffee", "beverage", "tea", "coffee", "juice", "noodle", "instant", "dairy", "bakery"];

export function fallbackProductImage(name: string, category?: string | null) {
  const text = `${name} ${category ?? ""}`.toLowerCase();
  if (householdWords.some((word) => text.includes(word))) return householdImage;
  if (snackWords.some((word) => text.includes(word))) return snacksImage;
  return grainImage;
}

export function ProductVisual({ src, name, category, className = "" }: { src?: string | null; name: string; category?: string | null; className?: string }) {
  return (
    <img
      src={src ?? fallbackProductImage(name, category)}
      alt={name}
      loading="lazy"
      width={912}
      height={912}
      className={className}
    />
  );
}