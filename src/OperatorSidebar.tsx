interface SidebarProps {
  currentPage?: string;
  userName?: string;
  userRole?: string;
}

const OperatorSidebar: React.FC<SidebarProps> = ({
  currentPage = 'operator-dashboard',
  userName = 'Operator',
  userRole = 'operator'
}) => {
  const logoSrc = '/logo.png';

  const navItems = [
    {
      id: 'operator-dashboard',
      href: '/dashboard',
      label: 'Dashboard',
      sublabel: 'Manage devices & alerts',
      icon: (
        <svg viewBox="0 0 16 16" fill="none">
          <rect x="1" y="1" width="6" height="6" rx="1.5" fill="#BDE8F5"/>
          <rect x="9" y="1" width="6" height="6" rx="1.5" fill="#BDE8F5" opacity="0.5"/>
          <rect x="1" y="9" width="6" height="6" rx="1.5" fill="#BDE8F5" opacity="0.5"/>
          <rect x="9" y="9" width="6" height="6" rx="1.5" fill="#BDE8F5" opacity="0.5"/>
        </svg>
      )
    },
    {
      id: 'devices',
      href: '/devices',
      label: 'Devices',
      sublabel: 'Maintenance & repairs',
      icon: (
        <svg viewBox="0 0 16 16" fill="none">
          <rect x="2" y="4" width="12" height="8" rx="1.5" stroke="#4988C4" strokeWidth="1.4"/>
          <path d="M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1" stroke="#4988C4" strokeWidth="1.4"/>
          <circle cx="8" cy="8" r="1.5" fill="#4988C4" opacity="0.6"/>
        </svg>
      )
    },
    {
      id: 'activity',
      href: '/activity',
      label: 'My Activity',
      sublabel: 'Your work history',
      icon: (
        <svg viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="5.5" stroke="#4988C4" strokeWidth="1.4"/>
          <path d="M8 5v3.5l2.5 1.5" stroke="#4988C4" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      )
    }
  ];

  const handleNavClick = (href: string) => {
    console.log('Navigate to:', href);
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      console.log('Logging out...');
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Space+Grotesk:wght@400;500;600&display=swap');

        .av-sidebar {
          width: 240px;
          min-height: 100vh;
          background: linear-gradient(180deg, #0F2854 0%, #0a1f42 100%);
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0; left: 0;
          border-right: 1px solid rgba(189,232,245,0.08);
          z-index: 100;
          font-family: 'DM Sans', sans-serif;
          overflow-y: auto;
        }

        .av-sidebar::before {
          content: '';
          position: absolute;
          inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234988C4' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          pointer-events: none;
        }

        .av-logo-area {
          padding: 18px 16px 16px;
          border-bottom: 1px solid rgba(189,232,245,0.08);
          position: relative;
        }

        .av-logo-row {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .av-logo-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          overflow: hidden;
          background: transparent;
          border: 1.5px solid rgba(189,232,245,0.15);
          padding: 0;
          position: relative;
          z-index: 1;
        }

        .av-logo-icon img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          border-radius: 50%;
        }

        .av-logo-text {
          display: flex;
          flex-direction: column;
          line-height: 1;
        }

        .av-logo-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #BDE8F5;
          letter-spacing: 0.02em;
        }

        .av-logo-sub {
          font-size: 10px;
          color: rgba(189,232,245,0.45);
          font-weight: 400;
          margin-top: 3px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .av-status-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 12px;
          background: rgba(189,232,245,0.07);
          border: 1px solid rgba(189,232,245,0.12);
          border-radius: 20px;
          padding: 5px 10px;
          width: fit-content;
        }

        .av-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #5cd67e;
          box-shadow: 0 0 0 2px rgba(92,214,126,0.3);
          animation: av-pulse 2s infinite;
        }

        @keyframes av-pulse {
          0%, 100% { box-shadow: 0 0 0 2px rgba(92,214,126,0.30); }
          50%       { box-shadow: 0 0 0 4px rgba(92,214,126,0.15); }
        }

        .av-status-label {
          font-size: 10px;
          font-weight: 500;
          color: rgba(189,232,245,0.7);
          letter-spacing: 0.04em;
        }

        .av-role-badge {
          margin-top: 8px;
          padding: 4px 12px;
          background: rgba(8, 145, 178, 0.13);
          border: 1px solid #0891b2;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 600;
          color: #0891b2;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          width: fit-content;
        }

        .av-nav-section {
          padding: 16px 12px 4px;
          flex: 1;
          position: relative;
        }

        .av-section-label {
          font-size: 10px;
          font-weight: 500;
          color: rgba(189,232,245,0.3);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 0 8px;
          margin-bottom: 4px;
        }

        .av-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 10px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.22s cubic-bezier(0.4, 0, 0.2, 1), transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          margin-bottom: 1px;
          user-select: none;
          text-decoration: none;
          border: 1px solid transparent;
        }

        .av-nav-item:hover { background: rgba(189,232,245,0.20); }
        .av-nav-item:active { transform: scale(0.98); }

        .av-nav-item.active {
          background: linear-gradient(90deg, rgba(73,136,196,0.30), rgba(73,136,196,0.10));
          border-color: rgba(73,136,196,0.30);
        }

        .av-nav-item.active::before {
          content: '';
          position: absolute;
          left: 0; top: 20%; bottom: 20%;
          width: 3px;
          background: #BDE8F5;
          border-radius: 0 4px 4px 0;
        }

        .av-nav-icon {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: rgba(189,232,245,0.06);
          transition: background 0.22s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .av-nav-item.active .av-nav-icon { background: rgba(73,136,196,0.35); }
        .av-nav-icon svg { width: 14px; height: 14px; }

        .av-nav-label-wrap { flex: 1; }

        .av-nav-label {
          font-size: 13px;
          font-weight: 500;
          color: rgba(189,232,245,0.65);
          transition: color 0.22s cubic-bezier(0.4, 0, 0.2, 1);
          line-height: 1;
        }

        .av-nav-sublabel { font-size: 10px; color: rgba(189,232,245,0.30); margin-top: 2px; }
        .av-nav-item.active .av-nav-label { color: #BDE8F5; }

        .av-nav-divider {
          height: 1px;
          background: rgba(189,232,245,0.07);
          margin: 10px 12px;
        }

        .av-user-footer {
          padding: 12px;
          border-top: 1px solid rgba(189,232,245,0.07);
          position: relative;
        }

        .av-user-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.22s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .av-user-card:hover { background: rgba(189,232,245,0.13); }

        .av-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0891b2, #4988C4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          color: #BDE8F5;
          border: 1.5px solid rgba(189,232,245,0.20);
          flex-shrink: 0;
        }

        .av-user-info { flex: 1; }
        .av-user-name { font-size: 12px; font-weight: 500; color: rgba(189,232,245,0.80); }
        .av-user-role { font-size: 10px; color: rgba(189,232,245,0.35); margin-top: 1px; }

        .av-user-menu-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          opacity: 0.4;
          width: 20px;
          height: 20px;
        }

        .av-dot { width: 3px; height: 3px; border-radius: 50%; background: #BDE8F5; }
      `}</style>

      <nav className="av-sidebar" aria-label="Operator navigation">
        <div className="av-logo-area">
          <div className="av-logo-row">
            <div className="av-logo-icon">
              <img src={logoSrc} alt="Aqua-Vision logo" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
            <div className="av-logo-text">
              <span className="av-logo-title">Aqua-Vision</span>
              <span className="av-logo-sub">Operations Center</span>
            </div>
          </div>
          <div className="av-role-badge">Operator</div>
          <div className="av-status-pill" role="status" aria-live="polite">
            <div className="av-status-dot"></div>
            <span className="av-status-label">Monitoring Active</span>
          </div>
        </div>

        <div className="av-nav-section">
          <div className="av-section-label" aria-hidden="true">Operations</div>

          {navItems.map((item) => (
            <div
              key={item.id}
              className={`av-nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => handleNavClick(item.href)}
              role="button"
              tabIndex={0}
              aria-current={currentPage === item.id ? 'page' : undefined}
            >
              <div className="av-nav-icon" aria-hidden="true">
                {item.icon}
              </div>
              <div className="av-nav-label-wrap">
                <div className="av-nav-label">{item.label}</div>
                <div className="av-nav-sublabel">{item.sublabel}</div>
              </div>
            </div>
          ))}

          <div className="av-nav-divider" role="separator"></div>
        </div>

        <div className="av-user-footer">
          <div className="av-user-card" role="button" tabIndex={0} aria-label="Logout" onClick={handleLogout}>
            <div className="av-avatar" aria-hidden="true">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="av-user-info">
              <div className="av-user-name">{userName}</div>
              <div className="av-user-role">{userRole.charAt(0).toUpperCase() + userRole.slice(1)} • Click to logout</div>
            </div>
            <div className="av-user-menu-btn" aria-hidden="true">
              <div className="av-dot"></div>
              <div className="av-dot"></div>
              <div className="av-dot"></div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default OperatorSidebar;
