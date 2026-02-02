import React from 'react';

const Background = ({ bgColor, children }) => {
    return (
        <div
            style={{
                // Fix the background to the screen
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: bgColor,

                // Centering logic
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',

                // Handle cases where the card is bigger than the viewport
                overflow: 'auto',
                padding: '20px',
                boxSizing: 'border-box'
            }}
            className="background-container"
        >
            {/* 
              This inner div prevents the card from shrinking 
              and ensures it stays centered within the fixed container.
            */}
            <div style={{ 
                flexShrink: 0, 
                position: 'relative',
                width: '100%',
                maxWidth: '700px',
                display: 'flex',
                justifyContent: 'center'
            }}>
                {children}
            </div>
        </div>
    );
};

export default Background;