import "./styles.scss";

type SwitchBtnProps = {
	isActive: boolean | null;
	toggleIsActive: () => void;
};

const SwitchBtn = ({ isActive, toggleIsActive }: SwitchBtnProps) => {
	return (
		<button
			type="button"
			onClick={toggleIsActive}
			className={`switch-btn ${isActive ? "switch-btn--active" : ""}`}
		></button>
	);
};

export default SwitchBtn;
