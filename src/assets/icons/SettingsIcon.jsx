const SettingsIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    className={`w-6 h-6 ${props.className || ''}`}
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11.983 13.76a1.76 1.76 0 100-3.52 1.76 1.76 0 000 3.52zM19.4 13.5a1.6 1.6 0 000-3l-1.2-.3a5.89 5.89 0 00-.5-1.2l.7-1a1.6 1.6 0 00-2.3-2.3l-1 .7a5.89 5.89 0 00-1.2-.5l-.3-1.2a1.6 1.6 0 00-3 0l-.3 1.2a5.89 5.89 0 00-1.2.5l-1-.7a1.6 1.6 0 00-2.3 2.3l.7 1a5.89 5.89 0 00-.5 1.2l-1.2.3a1.6 1.6 0 000 3l1.2.3a5.89 5.89 0 00.5 1.2l-.7 1a1.6 1.6 0 002.3 2.3l1-.7a5.89 5.89 0 001.2.5l.3 1.2a1.6 1.6 0 003 0l.3-1.2a5.89 5.89 0 001.2-.5l1 .7a1.6 1.6 0 002.3-2.3l-.7-1a5.89 5.89 0 00.5-1.2l1.2-.3z"
    />
  </svg>
);

export default SettingsIcon;
