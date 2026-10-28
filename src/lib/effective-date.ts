export type RateVersion = {
  id: string;
  effective: string;
  amountHundredths: number;
};

// Independent portfolio example: validated ISO dates, versions ordered oldest first.
// The caller permits only its five fixture dates; no employer payroll rules are included.
export function rateForDate(versions: readonly RateVersion[], workDate: string) {
  return versions
    .filter(version => version.effective <= workDate)
    .at(-1);
}
