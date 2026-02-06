'use client';

import React, { useState, useEffect } from 'react';
import PrimaryCard from '../layer/PrimaryCard';
import Background from '../layer/Background';
import TitleText from '../text/TitleText';
import { APP_COLORS } from '../config/colors';
import Lottie from 'lottie-react';
import loadingAnimation from '../lottie/loading.json';

const LoaderScreen = ({ message = 'Loading survey...' }) => {
    const [displayText, setDisplayText] = useState('Thinking...');
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Detect mobile
        if (typeof window !== 'undefined') {
            setIsMobile(window.innerWidth <= 700);
        }

        const timer = setTimeout(() => {
            setDisplayText('Odin AI greets you');
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <Background bgColor="#EAEDF0">
            <PrimaryCard
                color={APP_COLORS.ui.button}
                height={600}
                width="100%"
            >
                <div style={styles.container}>
                    <div style={{...styles.lottieContainer, width: isMobile ? '80%' : '100%'}}>
                        <Lottie animationData={loadingAnimation} loop={true} />
                    </div>
                    <div style={styles.textContainer}>
                        <TitleText color="#FFFFFF">{displayText}</TitleText>
                    </div>
                </div>
            </PrimaryCard>
        </Background>
    );
};

const styles = {
    container: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
    },
    lottieContainer: {
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1
    },
    textContainer: {
        paddingBottom: '20px',
        textAlign: 'center'
    }
};

export default LoaderScreen;
