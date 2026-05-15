import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

type DataTableProps<T> = {
  columns: { key: string; header: string; render: (row: T) => ReactNode }[];
  data: T[];
  emptyText?: string;
  paginated?: boolean;
  initialPageSize?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showRowNumber?: boolean;
};

const pageSizeOptions = [10, 25, 50, 100];

export function DataTable<T>({
  columns,
  data,
  emptyText = 'Belum ada data.',
  paginated = false,
  initialPageSize = 25,
  searchable = false,
  searchPlaceholder = 'Cari data...',
  searchValue = '',
  onSearchChange,
  showRowNumber = false,
}: DataTableProps<T>) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const totalPages = Math.max(Math.ceil(data.length / pageSize), 1);

  function scrollTable(direction: 'left' | 'right') {
    const container = scrollRef.current;
    if (!container) return;
    const amount = Math.max(container.clientWidth * 0.8, 320);
    container.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  }

  useEffect(() => {
    setPage(1);
  }, [data.length, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const visibleData = useMemo(() => {
    if (!paginated) return data;
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page, pageSize, paginated]);

  const startItem = data.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, data.length);

  return (
    <div className="animate-scale-in w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-black/[0.02]">
      {searchable && (
        <div className="border-b border-slate-200 bg-gradient-to-r from-white to-slate-50 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-xl">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>
              <input
                className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(event) => onSearchChange?.(event.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="hidden sm:inline">Geser tabel</span>
              <button
                type="button"
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md"
                onClick={() => scrollTable('left')}
              >
                ← Kiri
              </button>
              <button
                type="button"
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md"
                onClick={() => scrollTable('right')}
              >
                Kanan →
              </button>
            </div>
          </div>
        </div>
      )}
      {!searchable && (
        <div className="flex items-center justify-end gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
          <span className="hidden sm:inline">Geser tabel</span>
          <button type="button" className="rounded-xl border border-slate-300 bg-white px-3 py-2 font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md" onClick={() => scrollTable('left')}>← Kiri</button>
          <button type="button" className="rounded-xl border border-slate-300 bg-white px-3 py-2 font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md" onClick={() => scrollTable('right')}>Kanan →</button>
        </div>
      )}
      <div ref={scrollRef} className="max-h-[70vh] overflow-auto overscroll-contain scroll-smooth">
        <table className="min-w-[980px] divide-y divide-slate-200 text-sm md:min-w-full">
          <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
            <tr>
              {showRowNumber && <th className="w-16 px-4 py-3 text-left font-semibold text-slate-700">No</th>}
              {columns.map((column) => (
                <th key={column.key} className="whitespace-nowrap px-4 py-3 text-left font-semibold text-slate-700">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.length === 0 ? (
              <tr>
                <td className="px-4 py-12 text-center text-slate-500" colSpan={columns.length + (showRowNumber ? 1 : 0)}>
                  <div className="mx-auto max-w-sm rounded-2xl bg-slate-50 p-6">
                    <p className="text-3xl">□</p>
                    <p className="mt-2 font-medium text-slate-700">{emptyText}</p>
                    <p className="mt-1 text-xs text-slate-400">Coba ubah pencarian atau tambahkan data baru.</p>
                  </div>
                </td>
              </tr>
            ) : (
              visibleData.map((row, index) => (
                <tr key={index} className="transition hover:bg-blue-50/40">
                  {showRowNumber && <td className="whitespace-nowrap px-4 py-3 align-top text-slate-400">{(page - 1) * pageSize + index + 1}</td>}
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 align-top text-slate-700">
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {paginated && data.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-600 xl:flex-row xl:items-center xl:justify-between">
          <div className="text-center xl:text-left">
            Menampilkan <span className="font-semibold text-slate-900">{startItem}</span> sampai <span className="font-semibold text-slate-900">{endItem}</span> dari <span className="font-semibold text-slate-900">{data.length}</span> data
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <label className="flex items-center gap-2">
              <span>Rows</span>
              <select
                className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
              >
                {pageSizeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <span className="w-full px-2 text-center font-medium text-slate-700 sm:w-auto">
              Page {page} / {totalPages}
            </span>
            <button
              className="min-w-20 rounded-lg border border-slate-300 bg-white px-3 py-1 font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              disabled={page <= 1}
              onClick={() => setPage(1)}
            >
              First
            </button>
            <button
              className="min-w-20 rounded-lg border border-slate-300 bg-white px-3 py-1 font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
            >
              Prev
            </button>
            <button
              className="min-w-20 rounded-lg border border-slate-300 bg-white px-3 py-1 font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
            >
              Next
            </button>
            <button
              className="min-w-20 rounded-lg border border-slate-300 bg-white px-3 py-1 font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              disabled={page >= totalPages}
              onClick={() => setPage(totalPages)}
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
