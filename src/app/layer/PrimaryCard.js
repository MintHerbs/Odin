import React from 'react';

const PrimaryCard = ({ color, gradient, height, width = '500px', children }) => {
    const backgroundStyle = gradient
        ? { backgroundImage: `linear-gradient(135deg, ${gradient.join(', ')})` }
        : { backgroundColor: color };

    return (
        <div
            className="primary-card"
            style={{
                ...backgroundStyle,
                width: width,
                minHeight: `${height}px`,
                height: 'auto',
                borderRadius: '20px',
                flexShrink: 0,

                display: 'flex',
                flexDirection: 'column',

                // --- Vertical Positioning ---
                justifyContent: 'flex-start',
                paddingTop: '20px',

                // --- Horizontal Positioning ---
                alignItems: 'flex-start',
                paddingLeft: '40px',
                paddingRight: '40px',
                paddingBottom: '40px',

                gap: '2px',
                boxSizing: 'border-box',
                transition: 'all 0.5s ease'
            }}
        >
            {children}
        </div>
    );
};

export default PrimaryCard;