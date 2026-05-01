export type DateLabelPeriod = "day" | "week" | "month" | "year";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatMonthDay(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${String(date.getDate()).padStart(2, " ")}`;
}

export function formatDateLabel(date: Date, period: DateLabelPeriod): string {
  if (period === "year") {
    return String(date.getFullYear());
  }

  if (period === "month") {
    return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
  }

  return `${formatMonthDay(date)} ${WEEKDAY_NAMES[date.getDay()]}`;
}