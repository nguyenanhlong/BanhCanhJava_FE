import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Logo({ className = '', size = 'md' }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex flex-col">
        <span className={`font-sans tracking-tight text-amber-950 dark:text-amber-50 leading-tight font-extrabold ${size === 'lg' ? 'text-2xl' : size === 'xl' ? 'text-4xl' : 'text-md'}`}>
          Bánh Canh Cá Lóc
        </span>
        <span className="font-mono text-[10px] tracking-widest text-red-600 font-bold uppercase leading-none">
          Miền Trung
        </span>
      </div>
    </div>
  );
}
