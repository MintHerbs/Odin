import React, { useState } from 'react';
import { APP_COLORS } from '../config/colors';

const SubText = ({ children, fullText }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const handleReadMore = (e) => {
        e.preventDefault();
        setIsModalOpen(true);
    };

    return (
        <>
            <div style={styles.container}>
                <span className="sub-text" style={styles.sub}>
                    {children}
                    {fullText && (
                        <span
                            onClick={handleReadMore}
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                            style={{
                                ...styles.readMore,
                                opacity: isHovered ? 0.6 : 1
                            }}
                        >
                            {" "}read more...
                        </span>
                    )}
                </span>
            </div>

            {isModalOpen && (
                <div style={styles.overlay} onClick={() => setIsModalOpen(false)}>
                    <div
                        style={styles.modal}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            style={styles.closeBtn}
                            onClick={() => setIsModalOpen(false)}
                        >
                            ×
                        </button>
                        <div style={styles.modalContent}>
                            <span className="sub-text" style={styles.modalText}>
                                {fullText}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </>
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
        fontWeight: '500',
        fontSize: 15,
        color: APP_COLORS.ui.subtext,
        lineHeight: '1.5',
        display: 'block'
    },
    readMore: {
        fontWeight: '700', // Bold
        cursor: 'pointer',
        color: APP_COLORS.ui.button,
        marginLeft: '4px',
        transition: 'opacity 0.2s ease'
    },
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(4px)'
    },
    modal: {
        backgroundColor: 'white',
        width: '400px',
        padding: '30px',
        borderRadius: '20px',
        position: 'relative',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        maxHeight: '80vh',
        overflowY: 'auto'
    },
    closeBtn: {
        position: 'absolute',
        top: '15px',
        right: '15px',
        background: 'none',
        border: 'none',
        fontSize: '28px',
        cursor: 'pointer',
        lineHeight: 1,
        color: APP_COLORS.ui.button
    },
    modalContent: {
        marginTop: '10px'
    },
    modalText: {
        fontFamily: 'var(--font-roboto)',
        fontWeight: '500',
        fontSize: 16,
        color: APP_COLORS.ui.subtext,
        lineHeight: '1.6'
    }
};

export default SubText;