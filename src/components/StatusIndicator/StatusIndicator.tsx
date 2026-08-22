import "./StatusIndicator.scss";

type StatusIndicatorProps = {
	loading: boolean;
	error: any;
};

const StatusIndicator = ({ loading, error }: StatusIndicatorProps) => {
	return (
		<div className="status-indicator">
			<span
				className={`status-indicator__status ${
					loading ? "status--loading" : error ? "status--error" : "status--ok"
				}`}
			></span>
			<span style={{ fontSize: "0.8rem" }}>
				{loading ? "Updating..." : error ? error : "Updated"}
			</span>
		</div>
	);
};

export default StatusIndicator;
