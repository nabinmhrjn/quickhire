import { Check } from "lucide-react";
import type { UserSkill } from "@/types";

const ALL_CATEGORIES = [
  "ELECTRICAL", "PLUMBING", "CARPENTRY", "PAINTING", "HVAC",
  "LANDSCAPING", "CLEANING", "GENERAL_HANDYMAN", "ROOFING",
  "TILING", "APPLIANCE_REPAIR", "PEST_CONTROL",
] as const;

export function SkillPicker({ skills, onChange }: { skills: UserSkill[]; onChange: (s: UserSkill[]) => void }) {
  const selected = new Set(skills.map((s) => s.category));

  function toggle(category: string) {
    if (selected.has(category as UserSkill["category"])) {
      onChange(skills.filter((s) => s.category !== category));
    } else {
      onChange([...skills, { category: category as UserSkill["category"] }]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {ALL_CATEGORIES.map((cat) => {
        const isSelected = selected.has(cat);
        return (
          <button key={cat} type="button" onClick={() => toggle(cat)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors flex items-center gap-1.5 ${
              isSelected
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-background text-foreground border-border hover:border-emerald-400"
            }`}>
            {isSelected && <Check className="h-3.5 w-3.5" />}
            {cat.replace("_", " ")}
          </button>
        );
      })}
    </div>
  );
}
