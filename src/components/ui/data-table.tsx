import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  width?: string;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowId: (row: T) => string;
  emptyMessage?: string;
  className?: string;
  onRowClick?: (row: T) => void;
}

const alignClass: Record<NonNullable<DataTableColumn<unknown>["align"]>, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

export function DataTable<T>({
  columns,
  data,
  getRowId,
  emptyMessage = "Nenhum registro encontrado.",
  className,
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div className={cn("overflow-x-auto rounded-lg border border-border bg-surface", className)}>
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-well">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                style={column.width ? { width: column.width } : undefined}
                className={cn(
                  "px-4 py-3 text-xs font-medium uppercase tracking-wide text-ink-500",
                  alignClass[column.align ?? "left"],
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-ink-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={getRowId(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "border-b border-border last:border-0 hover:bg-surface-subtle",
                  onRowClick && "cursor-pointer",
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn("px-4 py-3 text-ink-800", alignClass[column.align ?? "left"])}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
