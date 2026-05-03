import React from 'react';

// Base skeleton element with shimmer animation
const SkeletonElement: React.FC<{
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  marginBottom?: string;
  style?: React.CSSProperties;
}> = ({ width = '100%', height = '20px', borderRadius = '4px', marginBottom = '0', style = {} }) => (
  <div style={{
    width,
    height,
    borderRadius,
    marginBottom,
    background: 'linear-gradient(90deg, rgba(189,232,245,0.1) 25%, rgba(189,232,245,0.2) 50%, rgba(189,232,245,0.1) 75%)',
    backgroundSize: '200% 100%',
    animation: 'skeleton-shimmer 1.5s infinite',
    ...style
  }} />
);

// Stat Card Skeleton
export const StatCardSkeleton: React.FC = () => (
  <div className="av-glass-stat" style={{
    borderRadius: '14px',
    padding: '20px'
  }}>
    <SkeletonElement width="80px" height="11px" />
    <SkeletonElement width="60px" height="28px" marginBottom="4px" style={{ marginTop: '8px' }} />
    <SkeletonElement width="100px" height="12px" />
  </div>
);

// Alert Item Skeleton
export const AlertItemSkeleton: React.FC = () => (
  <div style={{
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '16px 20px',
    borderBottom: '1px solid rgba(189,232,245,0.08)'
  }}>
    <SkeletonElement width="36px" height="36px" borderRadius="8px" />
    <div style={{ flex: 1, minWidth: 0 }}>
      <SkeletonElement width="200px" height="14px" marginBottom="4px" />
      <SkeletonElement width="100%" height="13px" marginBottom="6px" />
      <SkeletonElement width="250px" height="11px" />
    </div>
    <SkeletonElement width="60px" height="28px" borderRadius="8px" />
  </div>
);

// Device Item Skeleton
export const DeviceItemSkeleton: React.FC = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 20px',
    borderBottom: '1px solid rgba(189,232,245,0.08)'
  }}>
    <SkeletonElement width="10px" height="10px" borderRadius="50%" />
    <div style={{ flex: 1 }}>
      <SkeletonElement width="150px" height="14px" marginBottom="4px" />
      <SkeletonElement width="120px" height="12px" />
    </div>
    <SkeletonElement width="80px" height="20px" borderRadius="12px" />
  </div>
);

// Table Row Skeleton
export const TableRowSkeleton: React.FC = () => (
  <tr>
    <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(189,232,245,0.08)' }}>
      <SkeletonElement width="120px" height="13px" />
    </td>
    <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(189,232,245,0.08)' }}>
      <SkeletonElement width="100px" height="13px" />
    </td>
    <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(189,232,245,0.08)' }}>
      <SkeletonElement width="80px" height="16px" borderRadius="4px" />
    </td>
    <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(189,232,245,0.08)' }}>
      <SkeletonElement width="90px" height="13px" />
    </td>
    <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(189,232,245,0.08)' }}>
      <SkeletonElement width="60px" height="13px" />
    </td>
    <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(189,232,245,0.08)' }}>
      <SkeletonElement width="70px" height="20px" borderRadius="20px" />
    </td>
  </tr>
);

// Activity Item Skeleton
export const ActivityItemSkeleton: React.FC = () => (
  <div style={{
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px 20px',
    borderBottom: '1px solid rgba(189,232,245,0.08)'
  }}>
    <SkeletonElement width="36px" height="36px" borderRadius="8px" />
    <div style={{ flex: 1 }}>
      <SkeletonElement width="180px" height="14px" marginBottom="4px" />
      <SkeletonElement width="100%" height="13px" marginBottom="6px" />
      <SkeletonElement width="200px" height="11px" />
    </div>
  </div>
);

// Stats Pills Skeleton
export const StatsPillSkeleton: React.FC = () => (
  <div className="av-stat-pill" style={{
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    borderRadius: '8px'
  }}>
    <SkeletonElement width="30px" height="20px" />
    <SkeletonElement width="120px" height="12px" />
  </div>
);

// Card Header Skeleton
export const CardHeaderSkeleton: React.FC = () => (
  <div className="av-glass-header" style={{
    padding: '16px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  }}>
    <SkeletonElement width="150px" height="15px" />
    <SkeletonElement width="100px" height="12px" />
  </div>
);

// Empty State Skeleton (for full page loading)
export const FullPageSkeleton: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <>
    <style>{`
      @keyframes skeleton-shimmer {
        0% {
          background-position: -200% 0;
        }
        100% {
          background-position: 200% 0;
        }
      }
      
      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
    `}</style>
    {children}
  </>
);

// Loading spinner for individual sections
export const LoadingSpinner: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '20px',
    color: 'rgba(189,232,245,0.5)',
    fontSize: '12px'
  }}>
    <div style={{
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      border: '2px solid rgba(189,232,245,0.3)',
      borderTopColor: '#BDE8F5',
      animation: 'spin 1s linear infinite'
    }} />
    {text}
  </div>
);

export default SkeletonElement;
