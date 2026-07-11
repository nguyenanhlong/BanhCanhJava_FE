import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pageCount, onPageChange }: PaginationProps) {
  const [jumpValue, setJumpValue] = useState('');

  if (pageCount <= 1) return null;

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(jumpValue);
    if (Number.isInteger(n) && n >= 1 && n <= pageCount) {
      onPageChange(n);
      setJumpValue('');
    }
  };

  const windowSize = 5;
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  let end = Math.min(pageCount, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);

  const navBtn = 'w-7 h-7 flex items-center justify-center rounded-lg text-[#3E2F26] dark:text-[#3E2F26] bg-[#F3F0E9] dark:bg-[#FFF0E0] border border-[#E5E1D8] dark:border-[#D0C8C0] hover:bg-[#E5E1D8] dark:hover:bg-[#E8E0D8] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#F3F0E9] dark:disabled:hover:bg-[#FFF0E0] cursor-pointer';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-3 border-t border-[#E5E1D8] dark:border-[#E0D8D0]">
      <span className="text-[10px] font-bold text-[#8B7E74] dark:text-[#8B7E74]">Trang {page}/{pageCount}</span>

      <div className="flex items-center gap-1">
        <button type="button" onClick={() => onPageChange(1)} disabled={page === 1} className={navBtn} title="Trang đầu">
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>
        <button type="button" onClick={() => onPageChange(page - 1)} disabled={page === 1} className={navBtn} title="Trang trước">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        {start > 1 && <span className="px-1 text-[10px] text-[#8B7E74]">…</span>}
        {pages.map(p => (
          <button key={p} type="button" onClick={() => onPageChange(p)}
            className={`w-7 h-7 rounded-lg text-[10px] font-bold cursor-pointer ${p === page ? 'bg-[#E74C3C] text-white' : 'bg-[#F3F0E9] dark:bg-[#FFF0E0] text-[#3E2F26] dark:text-[#3E2F26] hover:bg-[#E5E1D8] dark:hover:bg-[#E8E0D8]'}`}>
            {p}
          </button>
        ))}
        {end < pageCount && <span className="px-1 text-[10px] text-[#8B7E74]">…</span>}
        <button type="button" onClick={() => onPageChange(page + 1)} disabled={page === pageCount} className={navBtn} title="Trang sau">
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <button type="button" onClick={() => onPageChange(pageCount)} disabled={page === pageCount} className={navBtn} title="Trang cuối">
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <form onSubmit={handleJump} className="flex items-center gap-1.5">
        <span className="text-[10px] text-[#8B7E74] dark:text-[#8B7E74] whitespace-nowrap">Đến trang</span>
        <input type="number" min={1} max={pageCount} value={jumpValue} onChange={(e) => setJumpValue(e.target.value)}
          placeholder={String(page)}
          className="w-14 text-[10px] p-1.5 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-[#E74C3C]" />
        <button type="submit"
          className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-[#F3F0E9] dark:bg-[#FFF0E0] text-[#3E2F26] dark:text-[#3E2F26] border border-[#E5E1D8] dark:border-[#D0C8C0] hover:bg-[#E5E1D8] dark:hover:bg-[#E8E0D8] cursor-pointer">
          Đi
        </button>
      </form>
    </div>
  );
}
