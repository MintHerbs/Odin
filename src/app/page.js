'use client';

import { useState } from 'react';
import StackCard from './layer/StackCard';
import { APP_COLORS } from './config/colors';
import Background from './layer/Background';
import TitleText from './text/TitleText';
import SubText from './text/SubText';
import SquareButton from './button/SquareButton';
import NavigationButton from './button/NavigationButton';
import PreviousButton from './button/PreviousButton';

export default function Home() {
  const [activeIndex, setActiveIndex] = useState(null);

  return (
    <Background bgColor={APP_COLORS.pink.background}>
      <StackCard
        baseColor={APP_COLORS.pink.primary}
        baseHeight={500}
        topColor={APP_COLORS.pink.secondary}
        topHeight={340}
      >
        <TitleText>Sega Genre: Romance</TitleText>
        <SubText>The English then advanced on the major Breton town of Vannes. The French garrison repelled an immediate assault and the English began a siege. English raiding parties devastated large parts of eastern Brittany, but attempts to</SubText>
        
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
          <PreviousButton />
          <NavigationButton />
        </div>
      </StackCard>
    </Background>
  );
}

const styles = {
  navContainer: {
    marginTop: 'auto',      // Pushes the container to the bottom of the flex box
    alignSelf: 'flex-end',  // Pushes the container to the right
    display: 'flex',
    gap: '10px',            // Space between Previous and Navigation buttons
    paddingTop: '20px'      // Extra breathing room from the items above
  }
};