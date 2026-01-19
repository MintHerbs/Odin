'use client';

import { useState } from 'react';
import StackCard from '../layer/StackCard';
import { APP_COLORS } from '../config/colors';
import Background from '../layer/Background';
import TitleText from '../text/TitleText';
import SubText from '../text/SubText';
import SquareButton from '../button/SquareButton';
import NavigationButton from '../button/NavigationButton';
import PreviousButton from '../button/PreviousButton';
import SlidePagination from '../layer/SlidePagination';

import Lottie from 'lottie-react';
import animationData from '../lottie/lottie.json';

const Survey = () => {
    const [activeIndex, setActiveIndex] = useState(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const totalSlides = 5;

    return (
        <Background bgColor={APP_COLORS.pink.background}>
            <StackCard
                baseColor={APP_COLORS.pink.primary}
                baseHeight={500}
                topColor={APP_COLORS.pink.secondary}
                topHeight={340}
                baseChildren={
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
                        <div style={{ width: '200px', height: '200px' }}>
                            <Lottie animationData={animationData} loop={true} />
                        </div>
                    </div>
                }
            >
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                    <SlidePagination amount={totalSlides} activeIndex={currentSlide} />
                </div>
                <TitleText>Sega Genre: Romance</TitleText>
                <SubText
                    fullText="The English then advanced on the major Breton town of Vannes. The French garrison repelled an immediate assault and the English began a siege. English raiding parties devastated large parts of eastern Brittany, but attempts to take key cities like Nantes and Rennes were unsuccessful. The conflict eventually drew in the kings of England and France directly."
                >
                    The English then advanced on the major Breton town of Vannes. The French garrison repelled an immediate assault and the English began a siege. English raiding parties devastated large parts of eastern Brittany,
                </SubText>

                <TitleText>How confident are you that this lyrics was written by a human?</TitleText>

                <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                    {Array.from({ length: 5 }).map((_, i) => {
                        const buttonNumber = i + 1;
                        return (
                            <SquareButton
                                key={buttonNumber}
                                label={buttonNumber}
                                isActive={activeIndex === buttonNumber}
                                onClick={() => setActiveIndex(buttonNumber)}
                            />
                        );
                    })}
                </div>

                {/* --- Navigation Buttons Container --- */}
                <div style={styles.navContainer}>
                    <PreviousButton onPress={() => setCurrentSlide(prev => Math.max(0, prev - 1))} />
                    <NavigationButton onPress={() => setCurrentSlide(prev => Math.min(totalSlides - 1, prev + 1))} />
                </div>
            </StackCard>
        </Background>
    );
};

const styles = {
    navContainer: {
        marginTop: 'auto',      // Pushes the container to the bottom of the flex box
        alignSelf: 'flex-end',  // Pushes the container to the right
        display: 'flex',
        gap: '10px',            // Space between Previous and Navigation buttons
        paddingTop: '20px'      // Extra breathing room from the items above
    }
};

export default Survey;
