import { useEffect, useRef } from "react";
import "./AutoGrowTextArea.scss";
import classNames from "classnames";

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

	// FIXME:
	const handleTextArea = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		e.target.style.height = "auto";
		e.target.style.height = e.target.scrollHeight + "px";
	};

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
				handleTextArea(e);
			}}
			placeholder={holder}
			onBlur={blur}
			disabled={disable}
			rows={1}
		></textarea>
	);
};

export default AutoGrowTextArea;
