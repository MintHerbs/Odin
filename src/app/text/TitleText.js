import React from 'react';
import { APP_COLORS } from '../config/colors';

const TitleText = ({ children, color }) => {
    return (
        <span style={{ ...styles.title, color: color || styles.title.color }}>
            {children}
        </span>
    );
};

const styles = {
    title: {
        fontFamily: 'var(--font-roboto)',
        fontWeight: '600', // Semi-bold
        fontSize: 20,
        color: APP_COLORS.ui.button
    }
};

export default TitleText;