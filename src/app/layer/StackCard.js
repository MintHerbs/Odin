import React from 'react';
import PrimaryCard from './PrimaryCard';

const StackCard = ({ baseColor, baseHeight, topColor, topHeight, children }) => {
    return (
        <div className="stack-card-container">
            {/* The base card remains empty */}
            <PrimaryCard color={baseColor} height={baseHeight} />

            {/* The top card now receives the text components */}
            <PrimaryCard color={topColor} height={topHeight}>
                {children}
            </PrimaryCard>
        </div>
    );
};

export default StackCard;