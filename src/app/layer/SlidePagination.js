import React from 'react';
import { APP_COLORS } from '../config/colors';

const SlidePagination = ({ amount = 1, activeIndex = 0 }) => {
    return (
        <div style={styles.container}>
            {Array.from({ length: amount }).map((_, index) => (
                <div
                    key={index}
                    style={{
                        ...styles.pill,
                        backgroundColor: index === activeIndex ? APP_COLORS.ui.button : APP_COLORS.ui.slider_inactive
                    }}
                />
            ))}
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'row',
        gap: '30px', // Increased spacing to spread bars across the card
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%'
    },
    pill: {
        width: '50px',
        height: '4px',
        borderRadius: '100px',
        transition: 'background-color 0.3s ease'
    }
};

export default SlidePagination;
