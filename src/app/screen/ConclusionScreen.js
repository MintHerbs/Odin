'use client';

import { useState } from 'react';
import StackCard from '../layer/StackCard';
import { APP_COLORS } from '../config/colors';
import Background from '../layer/Background';
import TitleText from '../text/TitleText';
import SubText from '../text/SubText';
import NavigationButton from '../button/NavigationButton';
import PreviousButton from '../button/PreviousButton';
import SlidePagination from '../layer/SlidePagination';
import Lottie from 'lottie-react';

// Import Lottie files
import successAnimation from '../lottie/success.json';
import infoAnimation from '../lottie/info.json';

const ConclusionScreen = ({ onComplete }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const totalSlides = 2;

    const handleNext = () => {
        if (currentSlide < totalSlides - 1) {
            setCurrentSlide(prev => prev + 1);
        } else {
            // Final slide - complete the flow
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

    // Theme logic
    const getTheme = () => {
        switch (currentSlide) {
            case 0: return APP_COLORS.mint; // Success theme (mint/green)
            case 1: return APP_COLORS.blue; // Info theme
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
                baseHeight={500}
                topColor={theme.secondary}
                topHeight={340}
                baseChildren={
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
                        <div style={{ width: '200px', height: '200px' }}>
                            <Lottie animationData={getLottie()} loop={true} />
                        </div>
                    </div>
                }
            >
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                    <SlidePagination amount={totalSlides} activeIndex={currentSlide} />
                </div>

                {/* Slide 1: Success Message */}
                {currentSlide === 0 && (
                    <>
                        <TitleText>Success</TitleText>
                        <SubText>
                            Your response has been successfully submitted and securely recorded in the database.
                            The information you provided will be used solely for academic research purposes.
                            All responses will be treated with confidentiality and analyzed anonymously.
                            Your participation contributes directly to the quality and validity of this research.
                            Thank you for taking the time to participate in this dissertation.
                        </SubText>
                    </>
                )}

                {/* Slide 2: Acknowledgement */}
                {currentSlide === 1 && (
                    <>
                        <TitleText>Acknowledgement</TitleText>
                        <SubText>
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
                            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. 
                            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
                            Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                        </SubText>
                    </>
                )}

                <div style={styles.navContainer}>
                    {currentSlide === 0 ? (
                        <NavigationButton onPress={handleNext} />
                    ) : (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <PreviousButton onPress={handlePrevious} />
                            <NavigationButton onPress={handleNext} />
                        </div>
                    )}
                </div>
            </StackCard>
        </Background>
    );
};

const styles = {
    navContainer: {
        marginTop: 'auto',
        alignSelf: 'flex-end',
        display: 'flex',
        gap: '10px',
        paddingTop: '20px'
    }
};

export default ConclusionScreen;
