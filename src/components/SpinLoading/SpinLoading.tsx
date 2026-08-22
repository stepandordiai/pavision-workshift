import type { CSSProperties } from "react";
import "./styles.scss";

type SpinLoadingProps = {
	bgColor?: string;
	afterBgColor?: string;
};

const SpinLoading = ({
	bgColor = "rgb(255, 75, 75)",
	afterBgColor = "rgb(255, 221, 214)",
}: SpinLoadingProps) => {
	return (
		<span
			style={
				{
					"--spin-bg-clr": bgColor,
					"--spin-after-bg-clr": afterBgColor,
				} as CSSProperties
			}
			className="spin-loading"
		></span>
	);
};

export default SpinLoading;
