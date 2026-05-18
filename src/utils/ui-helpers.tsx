/**
 * UTILS: COLORS
 * Shared color mapping for growth stages and categories.
 */

export const getStageColor = (stageId: string) => {
  const sid = stageId.toLowerCase();

  // 1. Young Plants / Establishment (Green) - Check this BEFORE generic seed to avoid shadowing 'seedling'
  if (
    sid.includes("seedling") ||
    sid.includes("sapling") ||
    sid.includes("establishment")
  )
    return { bg: "bg-green-100", text: "text-green-700", bar: "bg-green-400" };

  // 2. Early Life / Propagules (Stone/Emerald)
  if (sid.includes("seed") || sid.includes("sprout"))
    return { bg: "bg-stone-200", text: "text-stone-700", bar: "bg-stone-400" };

  if (
    sid.includes("germ") ||
    sid.includes("cutting") ||
    sid.includes("rhizome") ||
    sid.includes("clove") ||
    sid.includes("sucker") ||
    sid.includes("runner")
  )
    return {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      bar: "bg-emerald-400",
    };

  // 3. Vegetative / Biomass Growth (Lime)
  if (
    sid.includes("veg") ||
    sid.includes("habit") ||
    sid.includes("cane") ||
    sid.includes("crown") ||
    sid.includes("foliage")
  )
    return { bg: "bg-lime-100", text: "text-lime-700", bar: "bg-lime-400" };

  // 4. Structural Maturity (Teal)
  if (sid.includes("development") || sid.includes("formation"))
    return { bg: "bg-teal-100", text: "text-teal-700", bar: "bg-teal-400" };

  // 5. Reproductive / Bloom (Pink)
  if (
    sid.includes("flower") ||
    sid.includes("bloom") ||
    sid.includes("silk") ||
    sid.includes("tassel")
  )
    return { bg: "bg-pink-100", text: "text-pink-700", bar: "bg-pink-400" };

  // 6. Fruit / Set (Amber)
  if (sid.includes("fruit") || sid.includes("set") || sid.includes("pod"))
    return { bg: "bg-amber-100", text: "text-amber-700", bar: "bg-amber-400" };

  // 7. Maturity / Harvest (Orange)
  if (sid.includes("harvest") || sid.includes("ripe"))
    return {
      bg: "bg-orange-100",
      text: "text-orange-700",
      bar: "bg-orange-400",
    };

  // 8. Dormancy / End of Life (Blue/Stone)
  return { bg: "bg-blue-100", text: "text-blue-700", bar: "bg-blue-400" };

  return { bg: "bg-stone-800", text: "text-stone-400", bar: "bg-stone-600" };
};

export const getSeasonIcon = (season: string) => {
  switch (season) {
    case "Spring":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-sprout-icon lucide-sprout w-4 h-4 text-green-500"
        >
          <path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3" />
          <path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4" />
          <path d="M5 21h14" />
        </svg>
      );
    case "Summer":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-sun w-4 h-4 text-amber-500"
        >
          <circle cx="12" cy="12" r="4"></circle>
          <path d="M12 2v2"></path>
          <path d="M12 20v2"></path>
          <path d="m4.93 4.93 1.41 1.41"></path>
          <path d="m17.66 17.66 1.41 1.41"></path>
          <path d="M2 12h2"></path>
          <path d="M20 12h2"></path>
          <path d="m6.34 17.66-1.41 1.41"></path>
          <path d="m19.07 4.93-1.41 1.41"></path>
        </svg>
      );
    case "Autumn":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-leaf-icon lucide-leaf w-4 h-4 text-amber-900"
        >
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </svg>
      );
    case "Winter":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-snowflake-icon lucide-snowflake w-4 h-4 text-blue-500"
        >
          <path d="m10 20-1.25-2.5L6 18" />
          <path d="M10 4 8.75 6.5 6 6" />
          <path d="m14 20 1.25-2.5L18 18" />
          <path d="m14 4 1.25 2.5L18 6" />
          <path d="m17 21-3-6h-4" />
          <path d="m17 3-3 6 1.5 3" />
          <path d="M2 12h6.5L10 9" />
          <path d="m20 10-1.5 2 1.5 2" />
          <path d="M22 12h-6.5L14 15" />
          <path d="m4 10 1.5 2L4 14" />
          <path d="m7 21 3-6-1.5-3" />
          <path d="m7 3 3 6h4" />
        </svg>
      );
    default:
      return null;
  }
};
