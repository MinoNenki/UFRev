import type { Language } from '@/lib/i18n';
import { tr } from '@/lib/i18n';

export type BadgeCategory = 'store' | 'channel' | 'marketplace' | 'region' | 'data' | 'safety' | 'validation' | 'limit';

type CategoryBadgeProps = {
  category: BadgeCategory;
  language: Language;
  className?: string;
};

type CategoryBadgeLegendProps = {
  categories: BadgeCategory[];
  language: Language;
  title?: string;
  description?: string;
  className?: string;
};

function cx(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(' ');
}

function getBadgeMeta(category: BadgeCategory, language: Language) {
  switch (category) {
    case 'store':
      return {
        label: tr(language, { en: 'Store', pl: 'Sklep', es: 'Tienda', ru: 'Магазин' }),
        className: 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100',
        icon: (
          <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-5H9v5H5a1 1 0 0 1-1-1v-9.5Z" />
        ),
      };
    case 'channel':
      return {
        label: tr(language, { en: 'Channel', pl: 'Kanał', es: 'Canal', ru: 'Канал' }),
        className: 'border-amber-300/30 bg-amber-300/10 text-amber-100',
        icon: (
          <path d="M5 17h2a5 5 0 0 1 5-5V10a7 7 0 0 0-7 7Zm0-6h2a11 11 0 0 1 11 11h2C20 15.925 14.075 10 7 10H5Zm0-6h2a17 17 0 0 1 17 17h-2A15 15 0 0 0 7 7H5v-2Zm2 14a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" />
        ),
      };
    case 'marketplace':
      return {
        label: tr(language, { en: 'Marketplace', pl: 'Marketplace', es: 'Marketplace', ru: 'Marketplace' }),
        className: 'border-violet-300/30 bg-violet-300/10 text-violet-100',
        icon: (
          <path d="M4 8h16l-1.2 4.2A2 2 0 0 1 16.9 14H7.1a2 2 0 0 1-1.9-1.8L4 8Zm2 7h12v5H6v-5Zm3-11h6l1 2H8l1-2Z" />
        ),
      };
    case 'region':
      return {
        label: tr(language, { en: 'Region', pl: 'Region', es: 'Región', ru: 'Регион' }),
        className: 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100',
        icon: (
          <path d="M12 3 5 6v6c0 4.5 2.9 8.5 7 9 4.1-.5 7-4.5 7-9V6l-7-3Zm0 4.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z" />
        ),
      };
    case 'data':
      return {
        label: tr(language, { en: 'Data', pl: 'Dane', es: 'Datos', ru: 'Данные' }),
        className: 'border-sky-300/30 bg-sky-300/10 text-sky-100',
        icon: (
          <path d="M12 4c-4.4 0-8 1.3-8 3s3.6 3 8 3 8-1.3 8-3-3.6-3-8-3Zm-8 7v3c0 1.7 3.6 3 8 3s8-1.3 8-3v-3c-1.8 1.4-5 2-8 2s-6.2-.6-8-2Zm0 7v1c0 1.7 3.6 3 8 3s8-1.3 8-3v-1c-1.8 1.4-5 2-8 2s-6.2-.6-8-2Z" />
        ),
      };
    case 'safety':
      return {
        label: tr(language, { en: 'Safety', pl: 'Zabezpieczenie', es: 'Protección', ru: 'Защита' }),
        className: 'border-rose-300/30 bg-rose-300/10 text-rose-100',
        icon: (
          <path d="M12 3 6 5.5v5.7c0 4.1 2.5 7.9 6 9.3 3.5-1.4 6-5.2 6-9.3V5.5L12 3Zm3.7 6.8-4.2 4.7a1 1 0 0 1-1.5.04L8.2 12.8l1.5-1.4 1 1.1 3.5-3.9 1.5 1.2Z" />
        ),
      };
    case 'validation':
      return {
        label: tr(language, { en: 'Validation', pl: 'Walidacja', es: 'Validación', ru: 'Проверка' }),
        className: 'border-teal-300/30 bg-teal-300/10 text-teal-100',
        icon: (
          <path d="M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9Zm4.2 7.8-4.8 5.4a1 1 0 0 1-1.5.05l-2.2-2.2 1.4-1.4 1.45 1.44 4.05-4.54 1.6 1.25Z" />
        ),
      };
    case 'limit':
      return {
        label: tr(language, { en: 'Limit', pl: 'Limit', es: 'Límite', ru: 'Лимит' }),
        className: 'border-fuchsia-300/30 bg-fuchsia-300/10 text-fuchsia-100',
        icon: (
          <path d="M12 4a8 8 0 1 0 8 8 8 8 0 0 0-8-8Zm1 4v4.2l2.8 2.8-1.4 1.4L11 13V8h2Z" />
        ),
      };
  }
}

export function CategoryBadge({ category, language, className }: CategoryBadgeProps) {
  const meta = getBadgeMeta(category, language);

  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]', meta.className, className)}>
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 fill-current">
        {meta.icon}
      </svg>
      <span>{meta.label}</span>
    </span>
  );
}

export function CategoryBadgeLegend({ categories, language, title, description, className }: CategoryBadgeLegendProps) {
  return (
    <section className={cx('rounded-[28px] border border-white/10 bg-slate-950/60 p-5 shadow-[0_18px_70px_rgba(2,6,23,0.35)]', className)}>
      {(title || description) && (
        <div>
          {title ? <div className="text-[11px] uppercase tracking-[0.22em] text-cyan-200">{title}</div> : null}
          {description ? <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">{description}</p> : null}
        </div>
      )}
      <div className={cx('flex flex-wrap gap-2', title || description ? 'mt-4' : '')}>
        {categories.map((category) => (
          <CategoryBadge key={category} category={category} language={language} />
        ))}
      </div>
    </section>
  );
}