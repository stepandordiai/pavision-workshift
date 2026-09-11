import { useEffect, useRef } from "react";
import classNames from "classnames";
import "./AutoGrowTextArea.scss";

type AutoGrowTextAreaProps = {
	value: string;
	handleChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
	name: string;
	holder?: string;
	blur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
	disable?: boolean;
	customStyle?: React.CSSProperties;
};

const AutoGrowTextArea = ({
	value,
	handleChange,
	name,
	holder = "",
	blur,
	disable = false,
	customStyle = { background: "#fff" },
}: AutoGrowTextAreaProps) => {
	const autoGrowTextArea = useRef<HTMLTextAreaElement | null>(null);

	// TODO: LEARN THIS
	useEffect(() => {
		if (autoGrowTextArea.current) {
			autoGrowTextArea.current.style.height = "auto";
			autoGrowTextArea.current.style.height =
				autoGrowTextArea.current.scrollHeight + "px";
		}
	}, [value]);

	return (
		<textarea
			ref={autoGrowTextArea}
			className={classNames("auto-grow-text-area", {
				"auto-grow-text-area--disabled": disable,
			})}
			style={customStyle}
			name={name}
			value={value}
			onChange={(e) => {
				handleChange(e);
			}}
			placeholder={holder}
			onBlur={blur}
			disabled={disable}
			rows={1}
		></textarea>
	);
};

export default AutoGrowTextArea;
