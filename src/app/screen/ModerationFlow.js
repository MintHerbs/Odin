'use client';

import { useState } from 'react';
import StackCard from '../layer/StackCard';
import PrimaryCard from '../layer/PrimaryCard';
import { APP_COLORS } from '../config/colors';
import Background from '../layer/Background';
import TitleText from '../text/TitleText';
import SubText from '../text/SubText';
import SquareButton from '../button/SquareButton';
import NavigationButton from '../button/NavigationButton';
import PreviousButton from '../button/PreviousButton';
import SlidePagination from '../layer/SlidePagination';
import { submitSessionData } from '../utils/sessionUtils';

import Lottie from 'lottie-react';
import moonAnimation from '../lottie/moon.json';
import celebration from '../lottie/celebration.json';
import engager from '../lottie/engager.json';
import tipik from '../lottie/tipik.json';
import birthdayLottie from '../lottie/birthday.json';
import segaLottie from '../lottie/sega.json';

// Import Icons
import calendarIcon from '../reaction/calender.png';
import hateActive from '../reaction/hate_active.png';
import hateInactive from '../reaction/hate_inactive.png';
import noActive from '../reaction/no_active.png';
import noInactive from '../reaction/no_inactive.png';
import neutralActive from '../reaction/neutral_active.png';
import neutralInactive from '../reaction/neutral_inactive.png';
import okActive from '../reaction/ok_active.png';
import okInactive from '../reaction/ok_inactive.png';
import proActive from '../reaction/pro_active.png';
import proInactive from '../reaction/pro_inactive.png';

const ModeratingScreen = ({ sessionId, onComplete }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [birthday, setBirthday] = useState('');
    const [segaFamiliarity, setSegaFamiliarity] = useState(null);
    const [aiSentiment, setAiSentiment] = useState(null);
    const [showError, setShowError] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const totalSlides = 4;

    const handleNext = async () => {
        let isValid = true;

        if (currentSlide === 1 && !birthday) isValid = false;
        if (currentSlide === 2 && segaFamiliarity === null) isValid = false;
        if (currentSlide === 3 && aiSentiment === null) isValid = false;

        if (!isValid) {
            setShowError(true);
            setTimeout(() => setShowError(false), 3000);
            return;
        }

        if (currentSlide < totalSlides - 1) {
            setCurrentSlide(prev => prev + 1);
            setShowError(false);
        } else {
            // Last slide, submit data and complete
            setIsSubmitting(true);
            try {
                await submitSessionData(sessionId, birthday, segaFamiliarity, aiSentiment);
                if (onComplete) onComplete();
            } catch (error) {
                console.error('Error submitting session data:', error);
                setShowError(true);
                setTimeout(() => setShowError(false), 3000);
            } finally {
                setIsSubmitting(false);
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
            case 0: return APP_COLORS.blue;
            case 1: return APP_COLORS.birthday;
            case 2: return APP_COLORS.sega;
            case 3: return APP_COLORS.ai;
            default: return APP_COLORS.blue;
        }
    };

    const theme = getTheme();

    const getLottie = () => {
        switch (currentSlide) {
            case 0: return moonAnimation;
            case 1: return birthdayLottie;
            case 2: return segaLottie;
            case 3: return tipik;
            default: return moonAnimation;
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

                {/* Page 1: Welcome */}
                {currentSlide === 0 && (
                    <>
                        <TitleText>Welcome to the Survey!</TitleText>
                        <SubText>
                            This survey is performing a Turing Test, originally called the "imitation game" by Alan Turing in 1950, is a method of inquiry in artificial intelligence (AI) designed to determine whether a computer is capable of exhibiting human-like intelligent behavior. In this test, we trained an artificial intelligence to generate Mauritian sega lyrics. You are to guess which one was written by human and which one was written by an Ai. Sounds good? Click the Next button!
                        </SubText>
                    </>
                )}

                {/* Page 2: Age Selection */}
                {currentSlide === 1 && (
                    <>
                        <TitleText>When is your birthday?</TitleText>
                        <div style={styles.dateInputContainer}>
                            <input
                                type="date"
                                value={birthday}
                                onChange={(e) => setBirthday(e.target.value)}
                                style={styles.dateInput}
                                onClick={(e) => e.target.showPicker && e.target.showPicker()}
                            />
                        </div>
                    </>
                )}

                {/* Page 3: Sega Familiarity */}
                {currentSlide === 2 && (
                    <>
                        <TitleText>How familiar are you with Mauritian sega on a scale of 1-5?</TitleText>
                        <div className="modern-flow-buttons" style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                            {[1, 2, 3, 4, 5].map((num) => (
                                <SquareButton
                                    key={num}
                                    label={num}
                                    isActive={segaFamiliarity === num}
                                    onClick={() => setSegaFamiliarity(num)}
                                />
                            ))}
                        </div>
                    </>
                )}

                {/* Page 4: AI Sentiment */}
                {currentSlide === 3 && (
                    <>
                        <TitleText>How do you feel about Ai in the art industry?</TitleText>
                        <div className="modern-flow-buttons" style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                            {[
                                { id: 'hate', active: hateActive, inactive: hateInactive },
                                { id: 'no', active: noActive, inactive: noInactive },
                                { id: 'neutral', active: neutralActive, inactive: neutralInactive },
                                { id: 'ok', active: okActive, inactive: okInactive },
                                { id: 'pro', active: proActive, inactive: proInactive }
                            ].map((sentiment) => (
                                <SquareButton
                                    key={sentiment.id}
                                    isActive={aiSentiment === sentiment.id}
                                    onClick={() => setAiSentiment(sentiment.id)}
                                    activeImg={sentiment.active.src}
                                    inactiveImg={sentiment.inactive.src}
                                />
                            ))}
                        </div>
                    </>
                )}

                <div style={{ ...styles.navContainer, flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                    {showError && (
                        <div style={{ color: '#FF4D4D', fontSize: '14px', fontWeight: '600', marginBottom: '5px' }}>
                            {isSubmitting ? 'Submitting...' : 'Please complete this step to continue'}
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <PreviousButton onPress={handlePrevious} disabled={isSubmitting} />
                        <NavigationButton onPress={handleNext} disabled={isSubmitting} />
                    </div>
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
    },
    navContainerSingle: {
        marginTop: 'auto',
        alignSelf: 'flex-end',
        display: 'flex',
        gap: '10px',
        paddingTop: '40px'
    },
    dateInputContainer: {
        marginTop: '20px',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        backgroundColor: '#1F24290D', // 5% opacity of #1F2429
        borderRadius: '12px',
        padding: '0 15px',
        border: '1px solid rgba(31, 36, 41, 0.1)',
        transition: 'all 0.3s ease'
    },
    calendarIcon: {
        width: '40px',
        height: '40px',
        marginRight: '20px'
    },
    dateInput: {
        width: '100%',
        background: 'none',
        border: 'none',
        height: '65px',
        fontSize: '15px',
        fontWeight: '500', // Medium
        fontFamily: 'var(--font-roboto), Roboto, sans-serif',
        color: '#1F242999', // 60% opacity of #1F2429
        outline: 'none',
        cursor: 'pointer',
        appearance: 'none',
        '::placeholder': {
            color: '#1F242999'
        }
    }
};

export default ModeratingScreen;
