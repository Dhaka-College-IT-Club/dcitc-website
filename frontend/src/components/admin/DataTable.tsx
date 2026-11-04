"use client";

import { Inbox, Search } from "lucide-react";
import type { ReactNode } from "react";

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
  mobilePrimary?: boolean;
};

export default function DataTable<T>({
  columns,
  rows,
  getKey,
  loading = false,
  emptyTitle,
  emptyDescription,
  search,
  onSearch,
  searchPlaceholder = "Search…",
  actions,
  caption,
  fixed = false,
}: {
  columns: Column<T>[];
  rows: T[];
  getKey: (row: T) => string | number;
  loading?: boolean;
  emptyTitle: string;
  emptyDescription?: string;
  search?: string;
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
  actions?: (row: T) => ReactNode;
  caption?: string;
  /** Fixed table layout: columns respect their widths instead of growing. */
  fixed?: boolean;
}) {
  const primary = columns.find((column) => column.mobilePrimary) ?? columns[0];
  const secondary = columns.filter((column) => column !== primary);

  return (
    <div className="border border-line bg-white/[0.02]">
      {onSearch ? (
        <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-faint" aria-hidden="true" />
          <input
            type="search"
            value={search ?? ""}
            onChange={(event) => onSearch(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="h-8 w-full bg-transparent font-rajdhani text-sm text-muted placeholder:text-faint focus:outline-none"
          />
        </div>
      ) : null}

      {loading ? (
        <div aria-hidden="true">
          <div className="hidden lg:block">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-6 border-b border-line px-4 py-4 last:border-b-0"
              >
                <span className="h-3 w-1/4 animate-pulse bg-surface-2" />
                <span className="h-3 w-1/6 animate-pulse bg-surface-2" />
                <span className="h-3 w-1/5 animate-pulse bg-surface-2" />
                <span className="ml-auto h-7 w-24 animate-pulse bg-surface-2" />
              </div>
            ))}
          </div>
          <div className="divide-y divide-white/5 lg:hidden">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-3 p-4">
                <span className="block h-3.5 w-2/3 animate-pulse bg-surface-2" />
                <span className="block h-3 w-1/3 animate-pulse bg-surface-2" />
                <span className="block h-7 w-24 animate-pulse bg-surface-2" />
              </div>
            ))}
          </div>
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-14 text-center">
          <span className="flex h-11 w-11 items-center justify-center border border-line text-faint">
            <Inbox className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-4 font-orbitron text-xs uppercase tracking-[0.18em] text-muted">
            {emptyTitle}
          </p>
          {emptyDescription ? (
            <p className="mt-2 max-w-sm font-rajdhani text-sm text-faint">
              {emptyDescription}
            </p>
          ) : null}
        </div>
      ) : (
        <>
          <table
            className={`hidden w-full border-collapse text-left lg:table ${
              fixed ? "table-fixed" : ""
            }`}
          >
            {caption ? <caption className="sr-only">{caption}</caption> : null}
            <thead>
              <tr className="border-b border-line">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={`px-4 py-3 font-orbitron text-3xs font-medium uppercase tracking-[0.16em] text-faint ${column.className ?? ""}`}
                  >
                    {column.header}
                  </th>
                ))}
                {actions ? (
                  <th
                    scope="col"
                    className={`px-4 py-3 text-right ${
                      fixed ? "w-[11rem] whitespace-nowrap" : ""
                    }`}
                  >
                    <span className="sr-only">Actions</span>
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={getKey(row)}
                  className="border-b border-line transition-colors last:border-b-0 hover:bg-surface"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-4 py-3.5 align-middle ${column.className ?? ""}`}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                  {actions ? (
                    <td
                      className={`px-4 py-3.5 align-middle text-right ${
                        fixed ? "w-[11rem] whitespace-nowrap" : ""
                      }`}
                    >
                      <div className="flex shrink-0 justify-end gap-2">
                        {actions(row)}
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="divide-y divide-white/5 lg:hidden">
            {rows.map((row) => (
              <li key={getKey(row)} className="min-w-0 space-y-3 p-4">
                <div className="min-w-0 font-rajdhani text-base text-text">
                  {primary.render(row)}
                </div>
                {secondary.length > 0 ? (
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
                    {secondary.map((column) => (
                      <div key={column.key} className="min-w-0">
                        <dt className="font-orbitron text-3xs uppercase tracking-[0.14em] text-faint">
                          {column.header}
                        </dt>
                        <dd className="mt-0.5 min-w-0 break-words font-rajdhani text-sm text-muted">
                          {column.render(row)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
                {actions ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {actions(row)}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
