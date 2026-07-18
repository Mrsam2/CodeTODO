'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TodayIcon, CategoryTabIcon, VaultIcon, DashboardIcon, TimetableIcon, SettingsIcon } from './icons';
import styles from './TabNav.module.css';

const TABS = [
  { href: '/', label: 'Today', Icon: TodayIcon },
  { href: '/categories', label: 'Categories', Icon: CategoryTabIcon },
  { href: '/timetable', label: 'Timetable', Icon: TimetableIcon },
  { href: '/vault', label: 'Vault', Icon: VaultIcon },
  { href: '/dashboard', label: 'Dashboard', Icon: DashboardIcon },
  { href: '/settings', label: 'Settings', Icon: SettingsIcon },
];

export function TabNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.bar}>
      {TABS.map(({ href, label, Icon }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={[styles.item, active && styles.itemActive].filter(Boolean).join(' ')}>
            <Icon color="currentColor" size={22} />
            <span className={styles.label}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
