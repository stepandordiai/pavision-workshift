import StatusIndicator from "../../StatusIndicator/StatusIndicator";
import "./styles.scss";

type FooterProps = {
	loading: boolean;
	error: any;
};

const Footer = ({ loading, error }: FooterProps) => {
	return (
		<footer className="footer">
			<StatusIndicator loading={loading} error={error} />
		</footer>
	);
};

export default Footer;
