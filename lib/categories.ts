import { v4 as uuidv4 } from "uuid";
import type { Category } from "./types";

// ─── Category Colors ──────────────────────────────────────────
export const CATEGORY_COLORS: Record<string, string> = {
  // Parent categories
  Food: "#E07B39",
  Entertainment: "#8B5CF6",
  Travel: "#0EA5E9",
  "Sports/Fitness": "#10B981",
  "Going Out": "#F59E0B",
  Bills: "#6B7280",
  Shopping: "#EC4899",
  Health: "#EF4444",
  Education: "#3B82F6",
  Investments: "#14B8A6",
  Income: "#22C55E",
  Other: "#9CA3AF",
};

// ─── Default Categories Seed ──────────────────────────────────
export const DEFAULT_CATEGORIES: Omit<Category, "id">[] = [
  // ── Food ──
  { name: "Food", parent: "", icon: "UtensilsCrossed", color: "#E07B39", type: "expense", isActive: true },
  { name: "Groceries", parent: "Food", icon: "ShoppingBasket", color: "#E07B39", type: "expense", isActive: true },
  { name: "Eating Out", parent: "Food", icon: "Soup", color: "#E07B39", type: "expense", isActive: true },
  { name: "Snacks/Coffee", parent: "Food", icon: "Coffee", color: "#E07B39", type: "expense", isActive: true },
  { name: "Ordering In", parent: "Food", icon: "Package", color: "#E07B39", type: "expense", isActive: true },

  // ── Entertainment ──
  { name: "Entertainment", parent: "", icon: "Tv2", color: "#8B5CF6", type: "expense", isActive: true },
  { name: "Movies/Events", parent: "Entertainment", icon: "Film", color: "#8B5CF6", type: "expense", isActive: true },
  { name: "Subscriptions", parent: "Entertainment", icon: "RefreshCw", color: "#8B5CF6", type: "expense", isActive: true },
  { name: "Gaming", parent: "Entertainment", icon: "Gamepad2", color: "#8B5CF6", type: "expense", isActive: true },
  { name: "Books", parent: "Entertainment", icon: "BookOpen", color: "#8B5CF6", type: "expense", isActive: true },

  // ── Travel ──
  { name: "Travel", parent: "", icon: "MapPin", color: "#0EA5E9", type: "expense", isActive: true },
  { name: "Daily Commute", parent: "Travel", icon: "Bus", color: "#0EA5E9", type: "expense", isActive: true },
  { name: "Trips", parent: "Travel", icon: "Plane", color: "#0EA5E9", type: "expense", isActive: true },
  { name: "Fuel", parent: "Travel", icon: "Fuel", color: "#0EA5E9", type: "expense", isActive: true },
  { name: "Ride Share", parent: "Travel", icon: "Car", color: "#0EA5E9", type: "expense", isActive: true },

  // ── Sports/Fitness ──
  { name: "Sports/Fitness", parent: "", icon: "Dumbbell", color: "#10B981", type: "expense", isActive: true },
  { name: "Badminton", parent: "Sports/Fitness", icon: "Activity", color: "#10B981", type: "expense", isActive: true },
  { name: "Gym", parent: "Sports/Fitness", icon: "Dumbbell", color: "#10B981", type: "expense", isActive: true },
  { name: "Other Sports", parent: "Sports/Fitness", icon: "Trophy", color: "#10B981", type: "expense", isActive: true },
  { name: "Sports Gear", parent: "Sports/Fitness", icon: "ShoppingBag", color: "#10B981", type: "expense", isActive: true },

  // ── Going Out ──
  { name: "Going Out", parent: "", icon: "Users", color: "#F59E0B", type: "expense", isActive: true },
  { name: "Hangouts", parent: "Going Out", icon: "Users", color: "#F59E0B", type: "expense", isActive: true },
  { name: "Dates", parent: "Going Out", icon: "Heart", color: "#F59E0B", type: "expense", isActive: true },
  { name: "Parties", parent: "Going Out", icon: "PartyPopper", color: "#F59E0B", type: "expense", isActive: true },
  { name: "Gifts", parent: "Going Out", icon: "Gift", color: "#F59E0B", type: "expense", isActive: true },

  // ── Bills ──
  { name: "Bills", parent: "", icon: "FileText", color: "#6B7280", type: "expense", isActive: true },
  { name: "Rent", parent: "Bills", icon: "Home", color: "#6B7280", type: "expense", isActive: true },
  { name: "Electricity", parent: "Bills", icon: "Zap", color: "#6B7280", type: "expense", isActive: true },
  { name: "Internet", parent: "Bills", icon: "Wifi", color: "#6B7280", type: "expense", isActive: true },
  { name: "Phone", parent: "Bills", icon: "Smartphone", color: "#6B7280", type: "expense", isActive: true },
  { name: "Water", parent: "Bills", icon: "Droplets", color: "#6B7280", type: "expense", isActive: true },

  // ── Shopping ──
  { name: "Shopping", parent: "", icon: "ShoppingBag", color: "#EC4899", type: "expense", isActive: true },
  { name: "Clothing", parent: "Shopping", icon: "Shirt", color: "#EC4899", type: "expense", isActive: true },
  { name: "Electronics", parent: "Shopping", icon: "Laptop", color: "#EC4899", type: "expense", isActive: true },
  { name: "Personal Care", parent: "Shopping", icon: "Sparkles", color: "#EC4899", type: "expense", isActive: true },
  { name: "Home", parent: "Shopping", icon: "Sofa", color: "#EC4899", type: "expense", isActive: true },

  // ── Health ──
  { name: "Health", parent: "", icon: "HeartPulse", color: "#EF4444", type: "expense", isActive: true },
  { name: "Medical", parent: "Health", icon: "Stethoscope", color: "#EF4444", type: "expense", isActive: true },
  { name: "Pharmacy", parent: "Health", icon: "Pill", color: "#EF4444", type: "expense", isActive: true },
  { name: "Insurance", parent: "Health", icon: "Shield", color: "#EF4444", type: "expense", isActive: true },

  // ── Education ──
  { name: "Education", parent: "", icon: "GraduationCap", color: "#3B82F6", type: "expense", isActive: true },
  { name: "Courses", parent: "Education", icon: "MonitorPlay", color: "#3B82F6", type: "expense", isActive: true },
  { name: "Study Books", parent: "Education", icon: "BookMarked", color: "#3B82F6", type: "expense", isActive: true },
  { name: "Stationery", parent: "Education", icon: "PenLine", color: "#3B82F6", type: "expense", isActive: true },

  // ── Investments ──
  { name: "Investments", parent: "", icon: "TrendingUp", color: "#14B8A6", type: "investment", isActive: true },
  { name: "Mutual Funds", parent: "Investments", icon: "BarChart3", color: "#14B8A6", type: "investment", isActive: true },
  { name: "Stocks", parent: "Investments", icon: "LineChart", color: "#14B8A6", type: "investment", isActive: true },
  { name: "FD/RD", parent: "Investments", icon: "PiggyBank", color: "#14B8A6", type: "investment", isActive: true },
  { name: "Crypto", parent: "Investments", icon: "Bitcoin", color: "#14B8A6", type: "investment", isActive: true },
  { name: "PPF/ELSS", parent: "Investments", icon: "Landmark", color: "#14B8A6", type: "investment", isActive: true },
  { name: "Gold", parent: "Investments", icon: "CircleDollarSign", color: "#14B8A6", type: "investment", isActive: true },

  // ── Income ──
  { name: "Income", parent: "", icon: "Banknote", color: "#22C55E", type: "income", isActive: true },
  { name: "Salary", parent: "Income", icon: "BadgeIndianRupee", color: "#22C55E", type: "income", isActive: true },
  { name: "Freelance", parent: "Income", icon: "Briefcase", color: "#22C55E", type: "income", isActive: true },
  { name: "Interest", parent: "Income", icon: "Percent", color: "#22C55E", type: "income", isActive: true },
  { name: "Cashback", parent: "Income", icon: "RotateCcw", color: "#22C55E", type: "income", isActive: true },
  { name: "Dividends", parent: "Income", icon: "TrendingUp", color: "#22C55E", type: "income", isActive: true },
  { name: "Other Income", parent: "Income", icon: "Plus", color: "#22C55E", type: "income", isActive: true },

  // ── Other ──
  { name: "Other", parent: "", icon: "MoreHorizontal", color: "#9CA3AF", type: "expense", isActive: true },
  { name: "Miscellaneous", parent: "Other", icon: "Ellipsis", color: "#9CA3AF", type: "expense", isActive: true },
];

export function seedCategories(): Category[] {
  return DEFAULT_CATEGORIES.map((cat) => ({ ...cat, id: uuidv4() }));
}

export function getParentCategories(categories: Category[], type?: string): Category[] {
  return categories.filter(
    (c) => c.parent === "" && c.isActive && (type ? c.type === type : true)
  );
}

export function getSubcategories(categories: Category[], parentName: string): Category[] {
  return categories.filter((c) => c.parent === parentName && c.isActive);
}

export function getCategoryByName(categories: Category[], name: string): Category | undefined {
  return categories.find((c) => c.name === name);
}

export function getCategoryColor(categories: Category[], name: string): string {
  return getCategoryByName(categories, name)?.color ?? "#9CA3AF";
}

export function getCategoryIcon(categories: Category[], name: string): string {
  return getCategoryByName(categories, name)?.icon ?? "MoreHorizontal";
}
