'use client';

import { useState, useEffect } from 'react';
import StackCard from '../layer/StackCard';
import { APP_COLORS } from '../config/colors';
import Background from '../layer/Background';
import TitleText from '../text/TitleText';
import SubText from '../text/SubText';
import SquareButton from '../button/SquareButton';
import NavigationButton from '../button/NavigationButton';
import PreviousButton from '../button/PreviousButton';
import SlidePagination from '../layer/SlidePagination';
import { supabase } from '../database/database';

import Lottie from 'lottie-react';
import celebration from '../lottie/celebration.json';
import engager from '../lottie/engager.json';
import politics from '../lottie/politics.json';
import tipik from '../lottie/tipik.json';
import romance from '../lottie/romance.json';

const LOTTIE_MAP = {
    celebration,
    engager,
    politics,
    tipik,
    romance
};

const Survey = () => {
    const [records, setRecords] = useState([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [activeIndex, setActiveIndex] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data, error } = await supabase.from('survey_data').select('*').order('id', { ascending: true });
            if (error) throw error;
            setRecords(data || []);
        } catch (error) {
            console.error('Error fetching survey data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen">Loading Survey...</div>;
    if (records.length === 0) return <div className="flex items-center justify-center min-h-screen">No survey data found.</div>;

    const currentRecord = records[currentSlide];
    const totalSlides = records.length;

    // Get colors based on color_code from DB
    // Expected values: "pink", "blue", "purple", "yellow" etc. from APP_COLORS
    const themeName = currentRecord.color_code?.trim().toLowerCase() || 'pink';
    const theme = APP_COLORS[themeName] || APP_COLORS.pink;

    const matchedLottieName = currentRecord.lottie?.trim().toLowerCase();
    const lottieAnimation = LOTTIE_MAP[matchedLottieName] || celebration;

    console.log(`[Survey] Slide ${currentSlide}: color_code='${currentRecord.color_code}' -> theme='${themeName}', lottie='${currentRecord.lottie}' -> matched='${matchedLottieName}'`);

    const handleNext = () => {
        if (currentSlide < totalSlides - 1) {
            setCurrentSlide(prev => prev + 1);
            setActiveIndex(null); // Reset rating for next slide
        }
    };

    const handlePrevious = () => {
        if (currentSlide > 0) {
            setCurrentSlide(prev => prev - 1);
            setActiveIndex(null); // Reset rating for previous slide
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
                            <Lottie animationData={lottieAnimation} loop={true} />
                        </div>
                    </div>
                }
            >
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                    <SlidePagination amount={totalSlides} activeIndex={currentSlide} />
                </div>
                <TitleText>Sega Genre: {currentRecord.genre}</TitleText>
                <SubText
                    fullText={currentRecord.lyrics}
                >
                    {currentRecord.lyrics?.length > 140
                        ? currentRecord.lyrics.substring(0, 140)
                        : currentRecord.lyrics}
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
                    <PreviousButton onPress={handlePrevious} />
                    <NavigationButton onPress={handleNext} />
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
