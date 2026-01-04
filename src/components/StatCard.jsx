import PropTypes from 'prop-types';

const StatCard = ({ title, value, icon, colorTheme, onClick, loading }) => {
  const themeClasses = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
    green: { bg: 'bg-green-100', text: 'text-green-600' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
  };

  const theme = themeClasses[colorTheme] || themeClasses.blue;

  return (
    <div
      className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800">
            {loading ? <span className="animate-pulse">...</span> : value}
          </p>
        </div>
        <div className={`${theme.bg} p-3 rounded-full`}>
          <div className={`w-6 h-6 ${theme.text}`}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
};

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  icon: PropTypes.node.isRequired,
  colorTheme: PropTypes.oneOf(['blue', 'green', 'yellow', 'purple']),
  onClick: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

export default StatCard;

