import React from 'react';

const NavigationButton = ({ buttonText = 'Next', onPress = () => console.log(`Navigation to: ${buttonText}`) }) => {
  const handleClick = () => {
    onPress();
  };

  return (
    <button
      className="nav-btn"
      onClick={handleClick}
    >
      {buttonText}
    </button>
  );
};

export default NavigationButton;