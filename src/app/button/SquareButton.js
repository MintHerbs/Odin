import React from 'react';
import { APP_COLORS } from '../config/colors';

const SquareButton = ({
  label,
  isActive,
  onClick,
  activeImg,
  inactiveImg
}) => {

  const buttonStyle = {
    backgroundColor: isActive
      ? `${APP_COLORS.ui.button}ff`
      : `#2D353C1A`,
    opacity: '1',
    width: '45px',
    height: '45px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  };

  const circleContainerStyle = {
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: isActive ? APP_COLORS.btn.btn_inactive : APP_COLORS.ui.button,
    color: isActive ? APP_COLORS.btn.btn_inactive : APP_COLORS.ui.button,
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '12px',
    fontWeight: 'bold'
  };

  return (
    <button
      className="square-btn"
      style={buttonStyle}
      onClick={onClick}
    >
      {/* If images are provided, show them. Otherwise, show the circle and number */}
      {activeImg || inactiveImg ? (
        <img
          src={isActive ? activeImg : inactiveImg}
          style={{ width: '20px', height: '20px' }}
          alt="button icon"
        />
      ) : (
        <div
          className="circle-container"
          style={circleContainerStyle}
        >
          {label} {/* <--- This renders the 1, 2, 3, 4, 5 */}
        </div>
      )}
    </button>
  );
};

export default SquareButton;