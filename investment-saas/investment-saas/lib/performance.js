// Fixed monthly rate, simple interest — accrues daily on the ORIGINAL
// principal only, capped once the lock-in term is complete. No compounding.
export function computePerformance(investment, asOf = new Date()) {
  const start = new Date(investment.start_date);
  const msPerDay = 86400000;
  const daysElapsed = Math.max(0, Math.floor((asOf - start) / msPerDay));
  const totalDays = investment.lock_in_months * 30;
  const cappedDays = Math.min(daysElapsed, totalDays);
  const dailyRate = Number(investment.monthly_rate) / 100 / 30;
  const accrued = Number(investment.principal) * dailyRate * cappedDays;
  const balance = Number(investment.principal) + accrued;
  const progress = totalDays > 0 ? Math.min(1, daysElapsed / totalDays) : 0;
  const matured = daysElapsed >= totalDays;
  const maturityDate = new Date(start.getTime() + totalDays * msPerDay);

  return { accrued, balance, progress, matured, maturityDate, daysElapsed, totalDays };
}

export function fmtMoney(n) {
  return Number(n).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function fmtDate(d) {
  return new Date(d).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
