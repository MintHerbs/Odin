import React from 'react';

const PrimaryCard = ({ color, height, width = '500px', children }) => {
    return (
        <div
            className="primary-card"
            style={{
                backgroundColor: color,
                width: width,
                minHeight: `${height}px`,
                height: 'auto',
                borderRadius: '20px',
                flexShrink: 0,

                display: 'flex',
                flexDirection: 'column',

                // --- Vertical Positioning ---
                justifyContent: 'flex-start', // Moves text to the top
                paddingTop: '20px',           // Increase this specifically to "push" text down from the very top

                // --- Horizontal Positioning ---
                alignItems: 'flex-start',     // Keeps text on the left
                paddingLeft: '40px',          // Space from the left edge
                paddingRight: '40px',
                paddingBottom: '40px',

                gap: '2px',
                boxSizing: 'border-box'
            }}
        >
            {children}
        </div>
    );
};

export default PrimaryCard;