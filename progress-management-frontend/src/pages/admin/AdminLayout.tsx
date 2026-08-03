import type { ReactNode } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { Header } from '../../components/Header';
import './AdminLayout.css';

interface AdminLayoutProps {
  title: string;
  children: ReactNode;
}

export function AdminLayout({ title, children }: AdminLayoutProps) {
  return (
    <div className="admin-layout-container">
      <Sidebar />
      <div className="admin-main-wrapper">
        <Header title={title} />
        <main className="admin-content-area">{children}</main>
      </div>
    </div>
  );
}
