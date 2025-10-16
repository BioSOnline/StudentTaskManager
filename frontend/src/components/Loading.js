import React from 'react';
import '../styles/Loading.css';

const Loading = ({ 
  size = 'medium', 
  text = 'Loading...', 
  overlay = false,
  color = 'primary'
}) => {
  const LoadingSpinner = () => (
    <div className={`loading-spinner loading-${size} loading-${color}`}>
      <div className="spinner-ring">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  );

  if (overlay) {
    return (
      <div className="loading-overlay">
        <LoadingSpinner />
      </div>
    );
  }

  return <LoadingSpinner />;
};

// Skeleton loading component
export const SkeletonLoader = ({ 
  width = '100%', 
  height = '20px', 
  borderRadius = '4px',
  className = '' 
}) => (
  <div 
    className={`skeleton-loader ${className}`}
    style={{ width, height, borderRadius }}
  />
);

// Card skeleton
export const CardSkeleton = () => (
  <div className="card-skeleton">
    <SkeletonLoader height="200px" borderRadius="8px" className="skeleton-image" />
    <div className="skeleton-content">
      <SkeletonLoader height="24px" width="80%" />
      <SkeletonLoader height="16px" width="60%" />
      <SkeletonLoader height="16px" width="40%" />
    </div>
  </div>
);

// List skeleton
export const ListSkeleton = ({ items = 3 }) => (
  <div className="list-skeleton">
    {Array(items).fill(0).map((_, index) => (
      <div key={index} className="list-item-skeleton">
        <SkeletonLoader width="40px" height="40px" borderRadius="50%" />
        <div className="list-item-content">
          <SkeletonLoader height="16px" width="70%" />
          <SkeletonLoader height="14px" width="50%" />
        </div>
      </div>
    ))}
  </div>
);

export default Loading;