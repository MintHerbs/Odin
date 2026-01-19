import React from 'react';
import { APP_COLORS } from '../config/colors';

const SubText = ({ children }) => {
    return (
        <div style={styles.container}>
            <span style={styles.sub}>
                {children}
            </span>
        </div>
    );
};

const styles = {
    container: {
        borderLeft: `2px solid ${APP_COLORS.ui.button}`,
        paddingLeft: '16px',
        margin: '8px 0',
    },
    sub: {
        fontFamily: 'var(--font-roboto)',
        fontWeight: '500', // Medium
        fontSize: 15,
        color: APP_COLORS.ui.subtext,
        lineHeight: '1.5',
        display: 'block'
    }
};

export default SubText;