import grainImage from "@/assets/grocery-grains.jpg";
import householdImage from "@/assets/grocery-household.jpg";
import snacksImage from "@/assets/grocery-snacks.jpg";
import attaImage from "@/assets/prod-atta.jpg";
import riceImage from "@/assets/prod-rice.jpg";
import gheeImage from "@/assets/prod-ghee.jpg";
import detergentImage from "@/assets/prod-detergent.jpg";
import biscuitImage from "@/assets/prod-biscuit.jpg";
import teaImage from "@/assets/prod-tea.jpg";
import oilImage from "@/assets/prod-oil.jpg";
import soapImage from "@/assets/prod-soap.jpg";
import masalaImage from "@/assets/prod-masala.jpg";
import noodlesImage from "@/assets/prod-noodles.jpg";
import toothpasteImage from "@/assets/prod-toothpaste.jpg";
import milkImage from "@/assets/prod-milk.jpg";
import namkeenImage from "@/assets/prod-namkeen.jpg";
import shampooImage from "@/assets/prod-shampoo.jpg";
import chocolateImage from "@/assets/prod-chocolate.jpg";
import daalImage from "@/assets/prod-daal.jpg";

// Order matters: first matching rule wins. Each rule maps brand/product
// keywords to a realistic pack photo of that product type.
const rules: Array<[string[], string]> = [
  [["atta", "flour", "maida", "besan", "sooji", "suji", "rava", "pillsbury", "aashirvaad"], attaImage],
  [["rice", "basmati", "india gate", "daawat"], riceImage],
  [["ghee"], gheeImage],
  [["detergent", "surf excel", "ariel", "rin", "washing", "laundry"], detergentImage],
  [["biscuit", "cookie", "parle", "britannia", "sunfeast", "marie"], biscuitImage],
  [["tea", "coffee", "beverage"], teaImage],
  [["oil", "fortune", "mustard", "sunflower", "refined"], oilImage],
  [["soap", "lifebuoy", "dove", "body wash", "handwash", "dettol"], soapImage],
  [["masala", "spice", "mdh", "everest", "turmeric", "haldi", "jeera", "cumin", "coriander", "chilli", "pepper"], masalaImage],
  [["noodle", "maggi", "instant", "pasta", "vermicelli"], noodlesImage],
  [["toothpaste", "colgate", "pepsodent", "oral", "toothbrush"], toothpasteImage],
  [["chocolate", "cadbury", "nestle", "toffee", "candy", "kitkat", "oreo"], chocolateImage],
  [["milk", "amul taaza", "curd", "dahi", "paneer", "butter", "cheese", "bread", "bakery", "kellogg", "corn flakes", "oats", "cerelac"], milkImage],
  [["namkeen", "bhujia", "haldiram", "bikaji", "chips", "lay", "kurkure", "snack", "papad", "lijjat"], namkeenImage],
  [["shampoo", "hair", "clinic", "parachute", "conditioner"], shampooImage],
  [["dal", "daal", "pulse", "rajma", "chana", "moong", "toor", "urad", "sampann", "lentil"], daalImage],
];

const householdWords = ["clean", "brush", "paste", "care", "battery", "stationery", "broom", "utility", "diaper", "razor", "sanitary", "vim", "harpic", "lizol", "scotch"];
const snackWords = ["juice", "drink", "sugar", "salt", "sweet", "dry fruit", "nuts", "almond", "cashew"];

export function fallbackProductImage(name: string, category?: string | null) {
  const text = `${name} ${category ?? ""}`.toLowerCase();
  for (const [words, image] of rules) {
    if (words.some((word) => text.includes(word))) return image;
  }
  if (householdWords.some((word) => text.includes(word))) return householdImage;
  if (snackWords.some((word) => text.includes(word))) return snacksImage;
  return grainImage;
}

export function ProductVisual({ src, name, category, className = "" }: { src?: string | null | undefined; name: string; category?: string | null | undefined; className?: string | undefined }) {
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
