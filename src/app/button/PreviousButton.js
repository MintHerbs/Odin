import { APP_COLORS } from '../config/colors';

const PreviousButton = ({ buttonText = 'Previous', onPress = () => console.log('Previous clicked') }) => {
  return (
    <button
      className="text-btn"
      onClick={onPress}
      style={{
        color: APP_COLORS.ui.button
      }}
    >
      {buttonText}
    </button>
  );
};

export default PreviousButton;