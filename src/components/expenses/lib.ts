import { siteConfig } from "../../config"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Expense {
  timestamp: string
  what: string
  amount: number
  currency: string
  usd: number
}

export interface ExpensesResponse {
  expenses: Expense[]
}

export interface ListExpensesParams {
  password: string
  from: string
  to: string
  filter?: string
}

// ---------------------------------------------------------------------------
// Password helpers
// ---------------------------------------------------------------------------

export function loadPassword(): string {
  return localStorage.getItem(siteConfig.expenses.localStorageKey) ?? ""
}

export function savePassword(password: string): void {
  localStorage.setItem(siteConfig.expenses.localStorageKey, password)
}

// ---------------------------------------------------------------------------
// API client
// ---------------------------------------------------------------------------

function buildUrl(params: Record<string, string>): string {
  const qs = new URLSearchParams({ token: siteConfig.api.token, ...params })
  return `${siteConfig.api.baseUrl}${siteConfig.expenses.path}?${qs.toString()}`
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text)
  }
  return response.json() as Promise<T>
}

export async function listExpenses(
  params: ListExpensesParams,
): Promise<ExpensesResponse> {
  const searchParams: Record<string, string> = {
    password: params.password,
    from: `${params.from}T00:00:00Z`,
    to: `${params.to}T00:00:00Z`,
  }
  if (params.filter) {
    searchParams.filter = params.filter
  }
  return apiFetch<ExpensesResponse>(buildUrl(searchParams))
}

// ---------------------------------------------------------------------------
// Date helpers (Temporal-only)
// ---------------------------------------------------------------------------

export function startOfMonthISO(): string {
  const now = Temporal.Now.zonedDateTimeISO().toPlainDateTime()
  return Temporal.PlainDate.from({
    year: now.year,
    month: now.month,
    day: 1,
  }).toString()
}

export function tomorrowISO(): string {
  return Temporal.Now.zonedDateTimeISO()
    .toPlainDateTime()
    .add(Temporal.Duration.from({ days: 1 }))
    .toPlainDate()
    .toString()
}

export function formatLocaleDate(iso: string): string {
  let pd: Temporal.PlainDate
  if (iso.endsWith("Z")) {
    const instant = Temporal.Instant.from(iso)
    pd = instant.toZonedDateTimeISO("UTC").toPlainDate()
  } else {
    pd = Temporal.PlainDate.from(iso)
  }
  return pd.toLocaleString(siteConfig.expenses.locale)
}
