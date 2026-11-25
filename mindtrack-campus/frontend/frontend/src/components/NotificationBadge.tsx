export const NotificationBadge = ({ count }: { count: number }) => count > 0 ? (
  <span aria-hidden="true" className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-extrabold leading-none text-white ring-2 ring-white dark:ring-slate-900">
    {count > 99 ? '99+' : count}
  </span>
) : null;
