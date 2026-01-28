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
import { saveVotes } from '../utils/sessionUtils';

// Import Lottie files
import celebration from '../lottie/celebration.json';
import engager from '../lottie/engager.json';
import politics from '../lottie/politics.json';
import tipik from '../lottie/tipik.json';
import romance from '../lottie/romance.json';
import sega from '../lottie/sega.json';

const LOTTIE_MAP = {
    celebration,
    engager,
    politics,
    tipik,
    romance,
    seggae: sega
};

const Survey = ({ records, sessionId, onSurveyComplete }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [activeIndex, setActiveIndex] = useState(null);
    const [votes, setVotes] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showError, setShowError] = useState(false);

    const totalSlides = records.length;
    const currentRecord = records[currentSlide];

    const handleNext = async () => {
        if (activeIndex === null) {
            setShowError(true);
            return;
        }

        // Prepare the current vote object
        const currentVote = {
            lyricId: currentRecord.sid || currentRecord.id, // Handles Human (sid) or AI (id)
            genre: currentRecord.genre,
            vote: activeIndex,
            isAI: currentRecord.type === 'ai' || currentRecord.is_ai === true
        };

        // functional update to guarantee we have all votes for submission
        const updatedVotes = [...votes, currentVote];
        setVotes(updatedVotes);

        if (currentSlide < totalSlides - 1) {
            setCurrentSlide(prev => prev + 1);
            setActiveIndex(null);
            setShowError(false);
        } else {
            // Last slide - Submit all collected votes
            setIsSubmitting(true);
            try {
                await saveVotes(sessionId, updatedVotes);
                if (onSurveyComplete) onSurveyComplete();
            } catch (error) {
                console.error("Submission failed:", error);
                setShowError(true);
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handlePrevious = () => {
        if (currentSlide > 0) {
            setCurrentSlide(prev => prev - 1);
            // Optional: Logic to pop the last vote from state if returning
            setActiveIndex(null);
        }
    };

    if (!currentRecord) return null;

    const theme = APP_COLORS[currentRecord.color_code] || APP_COLORS.blue;

    return (
        <Background bgColor={theme.background}>
            <StackCard
                baseColor={theme.primary}
                baseHeight={520}
                topColor={theme.secondary}
                topHeight={320}
                baseChildren={
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
                        <div style={{ width: '180px', height: '180px' }}>
                            <Lottie animationData={LOTTIE_MAP[currentRecord.lottie] || tipik} loop={true} />
                        </div>
                    </div>
                }
            >
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
                    <SlidePagination amount={totalSlides} activeIndex={currentSlide} />
                </div>

                <TitleText>How do you rate these lyrics? (Genre: {currentRecord.genre})</TitleText>
                
                <div style={{ maxHeight: '120px', overflowY: 'auto', margin: '10px 0', padding: '10px', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: '8px' }}>
                    <SubText>{currentRecord.lyrics}</SubText>
                </div>

                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '10px' }}>
                    {[1, 2, 3, 4, 5].map((num) => (
                        <SquareButton
                            key={num}
                            label={num}
                            isActive={activeIndex === num}
                            onClick={() => setActiveIndex(num)}
                        />
                    ))}
                </div>

                <div style={{ marginTop: 'auto', alignSelf: 'flex-end', display: 'flex', gap: '10px', paddingTop: '20px' }}>
                    {showError && (
                        <span style={{ color: 'red', fontSize: '12px' }}>
                            {isSubmitting ? 'Saving...' : 'Please select a rating'}
                        </span>
                    )}
                    <PreviousButton onPress={handlePrevious} disabled={isSubmitting} />
                    <NavigationButton onPress={handleNext} disabled={isSubmitting} />
                </div>
            </StackCard>
        </Background>
    );
};

export default Survey;