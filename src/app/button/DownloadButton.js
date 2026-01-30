import React from 'react';

const DownloadButton = ({ 
  buttonText = 'Download Report', 
  url = '#', 
  fileName = 'Transparency_Report.pdf' 
}) => {
  
  return (
    <a
      href={url}
      download={fileName}
      target="_blank" 
      rel="noopener noreferrer"
      className="nav-btn"
      style={{ 
        textDecoration: 'none', 
        display: 'inline-flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: '10px'
      }}
    >
      {/* Downward Download SVG Icon */}
      <svg 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      
      {buttonText}
    </a>
  );
};

export default DownloadButton;