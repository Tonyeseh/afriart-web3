export function formatNumber(num: number): string {
  if (num < 1000) {
    return num.toString();
  } else if (num < 1000000) {
    const thousands = num / 1000;
    if (thousands % 1 === 0) {
      return `${thousands}k`;
    } else {
      return `${thousands.toFixed(1)}k`;
    }
  } else {
    const millions = num / 1000000;
    if (millions % 1 === 0) {
      return `${millions}M`;
    } else {
      return `${millions.toFixed(1)}M`;
    }
  }
}