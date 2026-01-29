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
import seggae from '../lottie/seggae.json';

const LOTTIE_MAP = {
    celebration,
    engager,
    politics,
    tipik,
    romance,
    seggae: seggae
};

const Survey = ({ records, sessionId, onSurveyComplete }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [activeIndex, setActiveIndex] = useState(null);
    const [votes, setVotes] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showError, setShowError] = useState(false);
    const [showLyricsModal, setShowLyricsModal] = useState(false);

    const totalSlides = records.length;
    const currentRecord = records[currentSlide];

    // Validate that we have exactly 10 records
    if (totalSlides !== 10) {
        console.error(`❌ CRITICAL: Expected exactly 10 lyrics, got ${totalSlides}`);
    }

    const handleNext = async () => {
        if (activeIndex === null) {
            setShowError(true);
            setTimeout(() => {
                setShowError(false);
            }, 3000);
            return;
        }

        // Prepare the current vote object
        const currentVote = {
            lyricId: currentRecord.sid || currentRecord.id,
            genre: currentRecord.genre,
            vote: activeIndex,
            isAI: currentRecord.type === 'ai' || currentRecord.is_ai === true,
            lottie: currentRecord.lottie
        };

        if (currentSlide < totalSlides - 1) {
            // Check if vote for this slide already exists
            const existingVoteIndex = votes.findIndex((v, idx) => idx === currentSlide);
            
            if (existingVoteIndex !== -1) {
                // Update existing vote
                setVotes(prev => {
                    const updated = [...prev];
                    updated[currentSlide] = currentVote;
                    return updated;
                });
            } else {
                // Add new vote
                setVotes(prev => [...prev, currentVote]);
            }
            
            setCurrentSlide(prev => prev + 1);
            
            // Set activeIndex to existing vote if navigating to a slide with a vote
            const nextSlideVote = votes[currentSlide + 1];
            setActiveIndex(nextSlideVote ? nextSlideVote.vote : null);
            
            setShowError(false);
        } else {
            // FINAL SLIDE - Combine all votes including current one
            setIsSubmitting(true);
            try {
                // Update or add the final vote
                const updatedVotes = [...votes];
                updatedVotes[currentSlide] = currentVote;
                
                console.log('📊 Submitting all votes to database...');
                console.log(`✅ Total votes collected: ${updatedVotes.length}`);
                
                // Validate we have exactly 10 votes
                if (updatedVotes.length !== 10) {
                    throw new Error(`Expected exactly 10 votes, got ${updatedVotes.length}`);
                }
                
                // Count human vs AI votes for verification
                const humanVotes = updatedVotes.filter(v => !v.isAI).length;
                const aiVotes = updatedVotes.filter(v => v.isAI).length;
                console.log(`👤 Human votes: ${humanVotes}, 🤖 AI votes: ${aiVotes}`);
                
                await saveVotes(sessionId, updatedVotes);
                console.log('✅ All votes saved successfully!');
                
                // Proceed to conclusion screen
                if (onSurveyComplete) {
                    onSurveyComplete();
                }
            } catch (error) {
                console.error("❌ Submission failed:", error);
                setShowError(true);
                setIsSubmitting(false);
            }
        }
    };

    const handlePrevious = () => {
        if (currentSlide > 0) {
            const previousSlide = currentSlide - 1;
            setCurrentSlide(previousSlide);
            
            // Restore the previous vote if it exists
            const previousVote = votes[previousSlide];
            setActiveIndex(previousVote ? previousVote.vote : null);
        }
    };

    // Format lyrics with proper line breaks
    const formatLyrics = (lyrics) => {
        if (!lyrics) return '';
        // Replace \n with actual line breaks
        return lyrics.split('\\n').map((line, index, array) => (
            <span key={index}>
                {line}
                {index < array.length - 1 && <br />}
            </span>
        ));
    };

    if (!currentRecord) return null;

    const theme = APP_COLORS[currentRecord.color_code] || APP_COLORS.blue;

    return (
        <>
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
                
                <div 
                    onClick={() => setShowLyricsModal(true)}
                    style={{ 
                        maxHeight: '120px', 
                        overflowY: 'auto', 
                        margin: '10px 0', 
                        padding: '10px', 
                        backgroundColor: 'rgba(255,255,255,0.3)', 
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        border: '2px solid transparent',
                        whiteSpace: 'pre-wrap'
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
                    <SubText>{formatLyrics(currentRecord.lyrics)}</SubText>
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

                <div style={{ ...styles.navContainer, flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                    {showError && (
                        <div style={{ color: '#FF4D4D', fontSize: '14px', fontWeight: '600', marginBottom: '5px' }}>
                            {isSubmitting ? 'Saving...' : 'Please complete this step to continue'}
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <PreviousButton onPress={handlePrevious} disabled={isSubmitting} />
                        <NavigationButton onPress={handleNext} disabled={isSubmitting} />
                    </div>
                </div>
            </StackCard>
        </Background>

        {/* Lyrics Modal */}
        {showLyricsModal && (
            <div 
                style={styles.modalOverlay}
                onClick={() => setShowLyricsModal(false)}
            >
                <div 
                    style={styles.modalContent}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div style={styles.modalHeader}>
                        <TitleText>{currentRecord.genre} Lyrics</TitleText>
                        <button 
                            onClick={() => setShowLyricsModal(false)}
                            className="modal-close-btn"
                            style={styles.closeButton}
                        >
                            ✕
                        </button>
                    </div>
                    <div style={styles.modalBody}>
                        <div style={{ whiteSpace: 'pre-wrap' }}>
                            {formatLyrics(currentRecord.lyrics)}
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
        width: '500px',
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
    }
};

export default Survey;