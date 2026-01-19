import React from 'react';
import PrimaryCard from './PrimaryCard';

const StackCard = ({ baseColor, baseHeight, topColor, topHeight, children, baseChildren }) => {
    return (
        <div className="stack-card-container">
            {/* The base card can now receive content, like a Lottie animation */}
            <PrimaryCard color={baseColor} height={baseHeight}>
                {baseChildren}
            </PrimaryCard>

            {/* The top card now receives the text components */}
            <PrimaryCard color={topColor} height={topHeight}>
                {children}
            </PrimaryCard>
        </div>
    );
};

export default StackCard;