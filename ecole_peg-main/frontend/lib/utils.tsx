import { type ClassValue, clsx } from "clsx";
import { format } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs));
}

export function formatDate(date: Date) {
  const string_date = format(date, "dd MMMM yyyy", { locale: fr });

  return string_date.replace(
    /^(\d{2}) (\p{L})/u,
    (_, d, m1) => `${d} ${m1.toUpperCase()}`,
  );
}
