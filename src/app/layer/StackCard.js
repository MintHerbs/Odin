import React from 'react';
import PrimaryCard from './PrimaryCard';

const StackCard = ({ baseColor, baseGradient, baseHeight, topColor, topGradient, topHeight, children, baseChildren }) => {
    return (
        <div className="stack-card-container">
            {/* The base card can now receive content, like a Lottie animation */}
            <PrimaryCard color={baseColor} gradient={baseGradient} height={baseHeight}>
                {baseChildren}
            </PrimaryCard>

            {/* The top card now receives the text components */}
            <PrimaryCard color={topColor} gradient={topGradient} height={topHeight}>
                {children}
            </PrimaryCard>
        </div>
    );
};

export default StackCard;