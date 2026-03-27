import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type DataTableColumn = {
  key: string;
  label: string;
  className?: string;
};

type DataTableProps = {
  columns: DataTableColumn[];
  children: ReactNode;
  className?: string;
};

export function DataTable({
  columns,
  children,
  className,
}: DataTableProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200 bg-white",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500",
                    column.className,
                  )}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

type DataTableRowProps = {
  children: ReactNode;
  className?: string;
};

export function DataTableRow({
  children,
  className,
}: DataTableRowProps) {
  return (
    <tr className={cn("border-b border-slate-100 last:border-b-0", className)}>
      {children}
    </tr>
  );
}

type DataTableCellProps = {
  children: ReactNode;
  className?: string;
};

export function DataTableCell({
  children,
  className,
}: DataTableCellProps) {
  return (
    <td className={cn("px-4 py-4 align-top text-sm text-slate-700", className)}>
      {children}
    </td>
  );
}
