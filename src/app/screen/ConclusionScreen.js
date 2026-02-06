'use client';

import { useState } from 'react';
import StackCard from '../layer/StackCard';
import { APP_COLORS } from '../config/colors';
import Background from '../layer/Background';
import TitleText from '../text/TitleText';
import SubText from '../text/SubText';
import NavigationButton from '../button/NavigationButton';
import PreviousButton from '../button/PreviousButton';
import DownloadButton from '../button/DownloadButton'; // Added DownloadButton import
import SlidePagination from '../layer/SlidePagination';
import Lottie from 'lottie-react';

// Import Lottie files
import successAnimation from '../lottie/success.json';
import infoAnimation from '../lottie/info.json';

const ConclusionScreen = ({ onComplete }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const totalSlides = 2;

    // Detect mobile on mount
    useState(() => {
        if (typeof window !== 'undefined') {
            setIsMobile(window.innerWidth <= 700);
        }
    }, []);

    const handleNext = () => {
        if (currentSlide < totalSlides - 1) {
            setCurrentSlide(prev => prev + 1);
        } else {
            if (onComplete) {
                onComplete();
            }
        }
    };

    const handlePrevious = () => {
        if (currentSlide > 0) {
            setCurrentSlide(prev => prev - 1);
        }
    };

    const getTheme = () => {
        switch (currentSlide) {
            case 0: return APP_COLORS.success; 
            case 1: return APP_COLORS.acknowledgement; 
            default: return APP_COLORS.blue;
        }
    };

    const theme = getTheme();

    const getLottie = () => {
        switch (currentSlide) {
            case 0: return successAnimation;
            case 1: return infoAnimation;
            default: return successAnimation;
        }
    };

    return (
        <Background bgColor={theme.background}>
            <StackCard
                baseColor={theme.primary}
                baseHeight={520}
                topColor={theme.secondary}
                topHeight={320}
                baseChildren={
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: isMobile ? '30px' : '40px' }}>
                        <div style={{ width: isMobile ? '160px' : '200px', height: isMobile ? '160px' : '200px' }}>
                            <Lottie animationData={getLottie()} loop={true} />
                        </div>
                    </div>
                }
            >
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: isMobile ? '15px' : '20px' }}>
                    <SlidePagination amount={totalSlides} activeIndex={currentSlide} />
                </div>

                {/* Slide 1: Success Message */}
                {currentSlide === 0 && (
                    <>
                        <TitleText>Success</TitleText>
                        <div style={styles.scrollContainer}>
                            <SubText>
                                Your response has been successfully submitted and securely recorded in the database.
                                The information you provided will be used solely for academic research purposes.
                                All responses will be treated with confidentiality and analyzed anonymously.
                                Your participation contributes directly to the quality and validity of this research.
                                Thank you for taking the time to participate in this study.
                            </SubText>
                        </div>
                    </>
                )}

                {/* Slide 2: Acknowledgement & Transparency */}
                {currentSlide === 1 && (
                    <>
                        <TitleText>Acknowledgement & Transparency</TitleText>
                        <div style={styles.scrollContainer}>
                            <SubText>
                                Your participation contributes essential data to a key question in human–AI interaction: can AI creativity be accepted in culturally sensitive contexts? This study recognises Mauritian Sega as a living archive of the Creole language and a UNESCO-recognised heritage form. The AI evaluated today explores how technology may support the intergenerational transmission of this cultural knowledge. While focusing on the textual dimension, the research respects Sega as a holistic art form rooted in historical consciousness. The specialised AI model, trained on authentic Sega lyrics, remains private to ensure research integrity and data confidentiality. A Transparency Report listing contributing artists and sources is available for download.
                            </SubText>
                        </div>
                    </>
                )}

                <div style={styles.navContainer}>
                    {currentSlide === 0 ? (
                        <NavigationButton onPress={handleNext} />
                    ) : (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <PreviousButton onPress={handlePrevious} />
                            {/* Replaced NavigationButton with DownloadButton for the final slide */}
                            <DownloadButton 
                                buttonText="Download"
                                url="https://drive.google.com/file/d/1R0n5AtQ9pwzTGna8uOW34Dn_ieLuGcfc/view"
                                onPress={onComplete} 
                            />
                        </div>
                    )}
                </div>
            </StackCard>
        </Background>
    );
};

const styles = {
    scrollContainer: {
        maxHeight: '150px',
        overflowY: 'auto',
        paddingRight: '10px',
        marginTop: '10px',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(0,0,0,0.1) transparent',
    },
    navContainer: {
        marginTop: 'auto',
        alignSelf: 'flex-end',
        display: 'flex',
        gap: '10px',
        paddingTop: '20px'
    }
};

export default ConclusionScreen;