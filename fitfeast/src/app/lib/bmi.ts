export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return +(weightKg / (heightM * heightM)).toFixed(2);
}
