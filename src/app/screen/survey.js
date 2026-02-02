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
import hotel from '../lottie/hotel.json';
import modern from '../lottie/modern.json';
import opinionAnimation from '../lottie/opinion.json';

const LOTTIE_MAP = {
    celebration,
    engager,
    politics,
    tipik,
    romance,
    seggae: seggae,
    hotel,
    modern,
    opinion: opinionAnimation
};

const Survey = ({ records, sessionId, onSurveyComplete, userIP }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [activeIndex, setActiveIndex] = useState(null);
    const [votes, setVotes] = useState([]);
    const [opinionText, setOpinionText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showError, setShowError] = useState(false);
    const [showLyricsModal, setShowLyricsModal] = useState(false);

    const totalSlides = 11; // 10 voting slides + 1 opinion slide
    const votingSlides = 10;
    const currentRecord = currentSlide < votingSlides ? records[currentSlide] : null;

    // Validate that we have exactly 10 records
    if (records.length !== 10) {
        console.error(`❌ CRITICAL: Expected exactly 10 lyrics, got ${records.length}`);
    }

    const handleNext = async () => {
        // Opinion slide (slide 11) - FINAL SUBMISSION: Save votes + opinion in batch
        if (currentSlide === votingSlides) {
            const wordCount = opinionText.trim().split(/\s+/).filter(word => word.length > 0).length;
            
            if (wordCount > 200 || opinionText.trim().length === 0) {
                setShowError(true);
                setTimeout(() => {
                    setShowError(false);
                }, 3000);
                return;
            }

            setIsSubmitting(true);
            try {
                console.log('� FINAL SUBMISSION: Saving all votes and opinion...');
                
                // Validate we have exactly 10 votes
                if (votes.length !== 10) {
                    throw new Error(`Expected exactly 10 votes, got ${votes.length}`);
                }
                
                // Count human vs AI votes for verification
                const humanVotes = votes.filter(v => !v.isAI).length;
                const aiVotes = votes.filter(v => v.isAI).length;
                console.log(`👤 Human votes: ${humanVotes}, 🤖 AI votes: ${aiVotes}`);
                
                // Save votes to database
                console.log('💾 Saving votes to database...');
                await saveVotes(sessionId, votes, userIP);
                console.log('✅ Votes saved successfully!');
                
                // Save opinion to database
                console.log('💬 Saving opinion to database...');
                const response = await fetch('/api/save-opinion', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        session_id: sessionId,
                        opinion: opinionText.trim()
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to save opinion');
                }

                console.log('✅ Opinion saved successfully!');
                console.log('🎉 All data submitted successfully!');
                
                // Proceed to conclusion screen
                if (onSurveyComplete) {
                    onSurveyComplete();
                }
            } catch (error) {
                console.error('❌ Final submission failed:', error);
                setShowError(true);
                setIsSubmitting(false);
            }
            return;
        }

        // Voting slides (1-10)
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

        if (currentSlide < votingSlides - 1) {
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
        } else if (currentSlide === votingSlides - 1) {
            // LAST VOTING SLIDE (slide 10) - Keep in local state, move to opinion immediately (NO DATABASE CALL)
            const updatedVotes = [...votes];
            updatedVotes[currentSlide] = currentVote;
            
            console.log('✅ All 10 votes collected locally');
            console.log(`📊 Total votes: ${updatedVotes.length}`);
            console.log('➡️  Moving to opinion slide (no database call)...');
            
            // Update state and move to opinion slide immediately
            setVotes(updatedVotes);
            setCurrentSlide(votingSlides);
            setActiveIndex(null);
        }
    };

    const handlePrevious = () => {
        if (currentSlide > 0) {
            const previousSlide = currentSlide - 1;
            setCurrentSlide(previousSlide);
            
            // If going back from opinion slide to voting slides
            if (currentSlide === votingSlides) {
                const previousVote = votes[previousSlide];
                setActiveIndex(previousVote ? previousVote.vote : null);
            } else {
                // Restore the previous vote if it exists
                const previousVote = votes[previousSlide];
                setActiveIndex(previousVote ? previousVote.vote : null);
            }
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

    if (!currentRecord && currentSlide < votingSlides) return null;

    // Determine theme based on current slide
    const theme = currentSlide === votingSlides 
        ? APP_COLORS.opinion 
        : (APP_COLORS[currentRecord.color_code] || APP_COLORS.blue);

    // Determine lottie animation
    const lottieAnimation = currentSlide === votingSlides
        ? LOTTIE_MAP.opinion
        : (LOTTIE_MAP[currentRecord.lottie] || tipik);

    return (
        <>
            <Background bgColor={theme.background}>
            {/* Red Ripple Effect */}
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
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
                        <div style={{ width: '180px', height: '180px' }}>
                            <Lottie animationData={lottieAnimation} loop={true} />
                        </div>
                    </div>
                }
            >
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
                    <SlidePagination amount={totalSlides} activeIndex={currentSlide} />
                </div>

                {/* Opinion Slide (Slide 11) */}
                {currentSlide === votingSlides && (
                    <>
                        <TitleText>What are your thoughts on using AI as a creative tool to aid artists, rather than a replacement?</TitleText>
                        
                        <div style={{ marginTop: '20px', marginBottom: '20px' }}>
                            <textarea
                                value={opinionText}
                                onChange={(e) => {
                                    const text = e.target.value;
                                    const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
                                    if (wordCount <= 200 || text.length < opinionText.length) {
                                        setOpinionText(text);
                                    }
                                }}
                                placeholder="Type your answer here (Optional)"
                                style={{
                                    width: '360px',
                                    height: '95px',
                                    backgroundColor: 'rgba(31, 36, 41, 0.15)',
                                    backdropFilter: 'blur(10px)',
                                    color: '#1F2429',
                                    border: '1px solid rgba(31, 36, 41, 0.2)',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    fontSize: '14px',
                                    fontFamily: 'var(--font-roboto), Roboto, sans-serif',
                                    resize: 'none',
                                    outline: 'none',
                                }}
                            />
                            <div style={{
                                fontSize: '12px',
                                color: opinionText.trim().split(/\s+/).filter(word => word.length > 0).length > 200 ? '#FF4D4D' : '#666',
                                fontFamily: 'var(--font-roboto), Roboto, sans-serif',
                                marginTop: '5px'
                            }}>
                                {opinionText.trim().split(/\s+/).filter(word => word.length > 0).length}/200 words
                            </div>
                        </div>
                    </>
                )}

                {/* Voting Slides (1-10) */}
                {currentSlide < votingSlides && (
                    <>
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
                    </>
                )}

                <div style={{ ...styles.navContainer, flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                    {showError && (
                        <div style={{ color: '#FF4D4D', fontSize: '14px', fontWeight: '600', marginBottom: '5px' }}>
                            {isSubmitting ? 'Saving...' : currentSlide === votingSlides ? 'Please provide a valid answer (max 200 words)' : 'Please complete this step to continue'}
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <PreviousButton onPress={handlePrevious} disabled={isSubmitting} />
                        <NavigationButton 
                            buttonText={currentSlide === votingSlides ? 'Submit' : 'Next'}
                            onPress={handleNext} 
                            disabled={isSubmitting} 
                        />
                    </div>
                </div>
            </StackCard>
        </Background>

        {/* Lyrics Modal - Only for voting slides */}
        {showLyricsModal && currentSlide < votingSlides && (
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

export default Survey;