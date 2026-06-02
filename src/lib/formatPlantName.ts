export const formatPlantName = (value: string | undefined | null): string => {
  if (!value) return "Plant";

  return value
    .replace(/^plant[-_]/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};
