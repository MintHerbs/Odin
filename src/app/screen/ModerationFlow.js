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
import { submitSessionData } from '../utils/sessionUtils';

import Lottie from 'lottie-react';
import moonAnimation from '../lottie/moon.json';
import birthdayLottie from '../lottie/birthday.json';
import segaLottie from '../lottie/sega.json';
import alertLottie from '../lottie/alert.json';
import aiLottie from '../lottie/ai.json';

// Import Icons
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
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showInstructionModal, setShowInstructionModal] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const totalSlides = 5;

    // Detect mobile on mount
    useState(() => {
        if (typeof window !== 'undefined') {
            setIsMobile(window.innerWidth <= 700);
        }
    }, []);

    // Calculate age from birthday
    const calculateAge = (birthdayString) => {
        if (!birthdayString) return null;
        const today = new Date();
        const birthDate = new Date(birthdayString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const validateBirthday = () => {
        if (!birthday) {
            setErrorMessage('Please complete this step to continue');
            return false;
        }
        
        const age = calculateAge(birthday);
        if (age < 10) {
            setErrorMessage('You must be at least 10 years old to participate');
            return false;
        }
        
        return true;
    };

    const handleNext = async () => {
        let isValid = true;
        let errorMsg = 'Please complete this step to continue';

        if (currentSlide === 2) {
            isValid = validateBirthday();
        } else if (currentSlide === 3 && segaFamiliarity === null) {
            isValid = false;
        } else if (currentSlide === 4 && aiSentiment === null) {
            isValid = false;
        }

        if (!isValid) {
            if (currentSlide !== 1) {
                setErrorMessage(errorMsg);
            }
            setShowError(true);
            setTimeout(() => {
                setShowError(false);
                setErrorMessage('');
            }, 3000);
            return;
        }

        if (currentSlide < totalSlides - 1) {
            setCurrentSlide(prev => prev + 1);
            setShowError(false);
            setErrorMessage('');
        } else {
            setIsSubmitting(true);
            try {
                const age = calculateAge(birthday);
                await submitSessionData(sessionId, birthday, segaFamiliarity, aiSentiment);
                
                if (onComplete) {
                    onComplete({
                        age,
                        segaFamiliarity,
                        aiSentiment
                    });
                }
            } catch (error) {
                console.error('Error submitting session data:', error);
                setErrorMessage('Failed to submit data. Please try again.');
                setShowError(true);
                setTimeout(() => {
                    setShowError(false);
                    setErrorMessage('');
                }, 3000);
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

    const getTheme = () => {
        switch (currentSlide) {
            case 0: return APP_COLORS.blue;
            case 1: return APP_COLORS.instruction;
            case 2: return APP_COLORS.birthday;
            case 3: return APP_COLORS.sega;
            case 4: return APP_COLORS.ai;
            default: return APP_COLORS.blue;
        }
    };

    const theme = getTheme();

    const getLottie = () => {
        switch (currentSlide) {
            case 0: return moonAnimation;
            case 1: return alertLottie;
            case 2: return birthdayLottie;
            case 3: return segaLottie;
            case 4: return aiLottie;
            default: return moonAnimation;
        }
    };

    return (
        <>
        <Background bgColor={theme.background}>
            {showError && (
                <div style={styles.rippleContainer}>
                    <div style={styles.ripple1}></div>
                    <div style={styles.ripple2}></div>
                    <div style={styles.ripple3}></div>
                </div>
            )}
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

                {currentSlide === 0 && (
                    <>
                        <TitleText>Welcome to the Survey!</TitleText>
                        <div style={styles.scrollableContent}>
                            <SubText>
                               This survey is based on the Turing Test, originally proposed by Alan Turing in 1950 as the "imitation game," a foundational method in artificial intelligence (AI) used to assess whether a machine can exhibit human-like behavior. In this study, an AI was trained to generate Mauritian sega lyrics in Mauritian Creole, a low-resource language. Your task is to determine which lyrics were written by a human and which were generated by the AI. Please click Next to begin.
                            </SubText>
                        </div>
                    </>
                )}

                {currentSlide === 1 && (
                    <>
                        <TitleText>How will this survey be conducted?</TitleText>
                        <div 
                            onClick={() => setShowInstructionModal(true)}
                            style={{ 
                                ...styles.scrollableContent,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                border: '2px solid transparent',
                                backgroundColor: 'rgba(255,255,255,0.3)',
                                borderRadius: '8px',
                                padding: '15px'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.4)';
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)';
                                e.currentTarget.style.borderColor = 'transparent';
                            }}
                        >
                            <SubText>
                                {'We will present you with 10 sets of lyrics (3 verses each). These consist of a mixture of human-written Sega lyrics and specialized AI-generated lyrics.\n\nYour task is to read each one and rate your confidence:\n\n1 = Definitely Human\n5 = Definitely AI\n\nNote: You will always be presented with both types of lyrics throughout the session, though the distribution may vary.\n\n💡 TIP: You can click on any lyric container for an expanded view.'}
                            </SubText>
                        </div>
                    </>
                )}

                {currentSlide === 2 && (
                    <>
                        <TitleText>When is your birthday?</TitleText>
                        <div style={{
                            ...styles.dateInputContainer,
                            padding: isMobile ? '0 12px' : '0 15px'
                        }}>
                            <input
                                type="date"
                                value={birthday}
                                onChange={(e) => setBirthday(e.target.value)}
                                style={{
                                    ...styles.dateInput,
                                    height: isMobile ? '55px' : '65px',
                                    fontSize: isMobile ? '14px' : '15px'
                                }}
                                onClick={(e) => e.target.showPicker && e.target.showPicker()}
                            />
                        </div>
                        {birthday && (
                            <div style={styles.ageDisplay}>
                                <SubText>Age: {calculateAge(birthday)} years old</SubText>
                            </div>
                        )}
                    </>
                )}

                {currentSlide === 3 && (
                    <>
                        <TitleText>How familiar are you with Mauritian sega on a scale of 1-5?</TitleText>
                        <div className="modern-flow-buttons" style={{ display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
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

                {currentSlide === 4 && (
                    <>
                        <TitleText>How do you feel about AI in the art industry?</TitleText>
                        <div className="modern-flow-buttons" style={{ display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
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
                        <div style={{ 
                            color: '#FF4D4D', 
                            fontSize: isMobile ? '12px' : '14px', 
                            fontWeight: '600', 
                            marginBottom: '5px',
                            textAlign: 'right'
                        }}>
                            {isSubmitting ? 'Submitting...' : errorMessage || 'Please complete this step to continue'}
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <PreviousButton onPress={handlePrevious} disabled={isSubmitting} />
                        <NavigationButton onPress={handleNext} disabled={isSubmitting} />
                    </div>
                </div>
            </StackCard>
        </Background>

        {showInstructionModal && (
            <div 
                style={styles.modalOverlay}
                onClick={() => setShowInstructionModal(false)}
            >
                <div 
                    style={styles.modalContent}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div style={styles.modalHeader}>
                        <TitleText>How will this survey be conducted?</TitleText>
                        <button 
                            onClick={() => setShowInstructionModal(false)}
                            className="modal-close-btn"
                            style={styles.closeButton}
                        >
                            ✕
                        </button>
                    </div>
                    <div style={styles.modalBody}>
                        <div style={{ whiteSpace: 'pre-wrap' }}>
                            {'We will present you with 10 sets of lyrics. These consist of a mixture of human-written Sega lyrics and specialized AI-generated lyrics.\n\nYour task is to read each one and rate your confidence:\n\n1 = Definitely Human\n5 = Definitely AI\n\nNote: You will always be presented with both types of lyrics throughout the session, though the distribution may vary.\n\n💡 TIP: You can click on any lyric container for an expanded view.'}
                        </div>
                    </div>
                </div>
            </div>
        )}
    </>
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
    dateInputContainer: {
        marginTop: '20px',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        backgroundColor: '#1F24290D',
        borderRadius: '12px',
        padding: '0 15px',
        border: '1px solid rgba(31, 36, 41, 0.1)',
        transition: 'all 0.3s ease'
    },
    dateInput: {
        width: '100%',
        background: 'none',
        border: 'none',
        height: '65px',
        fontSize: '15px',
        fontWeight: '500',
        fontFamily: 'var(--font-roboto), Roboto, sans-serif',
        color: 'rgba(31, 36, 41, 0.6)',
        outline: 'none',
        cursor: 'pointer',
        WebkitAppearance: 'none',
        MozAppearance: 'none',
        appearance: 'none'
    },
    ageDisplay: {
        marginTop: '10px',
        textAlign: 'center',
        opacity: 0.8
    },
    scrollableContent: {
        maxHeight: '150px',
        overflowY: 'auto',
        margin: '10px 0',
        paddingRight: '10px',
        whiteSpace: 'pre-wrap',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(0,0,0,0.1) transparent'
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.2s ease-in-out'
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        padding: '30px',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
        animation: 'slideUp 0.3s ease-out'
    },
    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '15px',
        borderBottom: '2px solid #E0E0E0'
    },
    closeButton: {
        background: 'none',
        border: 'none',
        fontSize: '28px',
        cursor: 'pointer',
        color: '#666',
        padding: '0',
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        transition: 'all 0.2s ease'
    },
    modalBody: {
        overflowY: 'auto',
        flex: 1,
        padding: '10px 0',
        lineHeight: '1.8',
        fontSize: '15px',
        color: '#1F2429',
        fontFamily: 'var(--font-roboto), Roboto, sans-serif'
    },
    rippleContainer: {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0
    },
    ripple1: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255, 77, 77, 0.4) 0%, rgba(255, 77, 77, 0.2) 40%, transparent 70%)',
        animation: 'rippleExpand 2s ease-out forwards'
    },
    ripple2: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255, 77, 77, 0.35) 0%, rgba(255, 77, 77, 0.15) 40%, transparent 70%)',
        animation: 'rippleExpand 2s ease-out 0.3s forwards'
    },
    ripple3: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255, 77, 77, 0.3) 0%, rgba(255, 77, 77, 0.1) 40%, transparent 70%)',
        animation: 'rippleExpand 2s ease-out 0.6s forwards'
    }
};

export default ModeratingScreen;
