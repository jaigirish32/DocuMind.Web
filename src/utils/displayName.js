export function getDisplayName(name) {
  if (!name) return "";
  return name.replace(/^.*[\\\/]/, "");
}