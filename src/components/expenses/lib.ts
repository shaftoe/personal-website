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

export interface DraftExpense {
  id: number
  timestamp: string
  what: string
  amount: number
  currency: string
}

export const CURRENCIES = siteConfig.expenses.currencies
export const DEFAULT_CURRENCY = siteConfig.expenses.defaultCurrency as Currency
export type Currency = keyof typeof CURRENCIES

export interface ExpensesResponse {
  expenses: Expense[]
}

export interface DraftsResponse {
  expenses: DraftExpense[]
}

export interface ListExpensesParams {
  password: string
  from: string
  to: string
  filter?: string
}

export interface NewExpensePayload {
  what: string
  amount: number
  currency: Currency
  timestamp: string
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

async function apiSend(url: string, init?: RequestInit): Promise<void> {
  const response = await fetch(url, init)
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text)
  }
}

// ---------------------------------------------------------------------------
// List expenses
// ---------------------------------------------------------------------------

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
// List drafts
// ---------------------------------------------------------------------------

export async function listDrafts(
  params: ListExpensesParams,
): Promise<DraftsResponse> {
  const searchParams: Record<string, string> = {
    password: params.password,
    from: `${params.from}T00:00:00Z`,
    to: `${params.to}T00:00:00Z`,
    drafts: "true",
  }
  if (params.filter) {
    searchParams.filter = params.filter
  }
  return apiFetch<DraftsResponse>(buildUrl(searchParams))
}

// ---------------------------------------------------------------------------
// Batch update drafts (edits + deletes in one call each)
// ---------------------------------------------------------------------------

export async function batchUpdateDrafts(
  password: string,
  updates: DraftExpense[],
  deletes: DraftExpense[],
): Promise<void> {
  const url = buildUrl({ password })
  const promises: Promise<void>[] = []

  for (const draft of updates) {
    promises.push(apiSend(url, { method: "PUT", body: JSON.stringify(draft) }))
  }
  for (const draft of deletes) {
    promises.push(
      apiSend(url, { method: "DELETE", body: JSON.stringify(draft) }),
    )
  }

  await Promise.all(promises)
}

// ---------------------------------------------------------------------------
// Create new expense
// ---------------------------------------------------------------------------

export async function createExpense(
  password: string,
  expense: NewExpensePayload,
): Promise<void> {
  const url = buildUrl({ password })
  await apiSend(url, {
    method: "POST",
    body: JSON.stringify(expense),
  })
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

export function todayISO(): string {
  return Temporal.Now.zonedDateTimeISO()
    .toPlainDateTime()
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
