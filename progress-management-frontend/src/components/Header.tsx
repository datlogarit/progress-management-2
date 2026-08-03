import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, UserCircle, Shield, Bell, CheckCheck, MessageSquare, CheckCircle2, UserPlus } from 'lucide-react';
import { 
  getUserNotificationsApi, 
  getUnreadNotificationCountApi, 
  markNotificationAsReadApi, 
  markAllNotificationsAsReadApi,
  type NotificationDTO 
} from '../services/notificationService';
import './Header.css';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const count = await getUnreadNotificationCountApi();
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to fetch unread count', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const handleToggleNotifications = async () => {
    if (!showNotifications) {
      try {
        const list = await getUserNotificationsApi();
        setNotifications(list);
      } catch (err) {
        console.error('Failed to fetch notifications list', err);
      }
    }
    setShowNotifications(!showNotifications);
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await markNotificationAsReadApi(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsReadApi();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TASK_ASSIGNED':
        return <UserPlus size={16} className="notif-icon assigned" />;
      case 'TASK_STATUS_CHANGED':
        return <CheckCircle2 size={16} className="notif-icon status" />;
      case 'NEW_COMMENT':
        return <MessageSquare size={16} className="notif-icon comment" />;
      default:
        return <Bell size={16} className="notif-icon" />;
    }
  };

  return (
    <header className="app-header">
      <div className="header-title-container">
        <h1 className="header-page-title">{title}</h1>
      </div>

      <div className="header-user-section">
        {/* Notification Bell Icon */}
        <div className="notification-wrapper" ref={dropdownRef}>
          <button 
            className={`notification-btn ${showNotifications ? 'active' : ''}`} 
            onClick={handleToggleNotifications}
            title="Thông báo"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="notification-badge">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="notification-dropdown">
              <div className="dropdown-header">
                <span className="dropdown-title">Thông báo hệ thống</span>
                {unreadCount > 0 && (
                  <button className="mark-all-btn" onClick={handleMarkAllAsRead}>
                    <CheckCheck size={14} /> Đánh dấu đã đọc
                  </button>
                )}
              </div>

              <div className="dropdown-body">
                {notifications.length === 0 ? (
                  <div className="empty-notifications">Chưa có thông báo nào</div>
                ) : (
                  notifications.map(item => (
                    <div 
                      key={item.id} 
                      className={`notif-item ${!item.isRead ? 'unread' : ''}`}
                      onClick={() => !item.isRead && handleMarkAsRead(item.id)}
                    >
                      <div className="notif-icon-wrapper">
                        {getNotificationIcon(item.type)}
                      </div>
                      <div className="notif-content">
                        <div className="notif-title">{item.title}</div>
                        <div className="notif-message">{item.message}</div>
                        <div className="notif-time">
                          {new Date(item.createdAt).toLocaleString('vi-VN')}
                        </div>
                      </div>
                      {!item.isRead && <span className="unread-dot" />}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="user-profile-badge">
          <div className="user-avatar">
            <UserCircle size={28} className="avatar-icon" />
          </div>
          <div className="user-info">
            <span className="user-name">{user?.fullName || user?.username}</span>
            <span className="user-role-tag">
              <Shield size={10} /> {user?.role}
            </span>
          </div>
        </div>

        <button 
          className="logout-btn" 
          onClick={logout} 
          title="Đăng xuất hệ thống"
        >
          <LogOut size={16} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </header>
  );
}
