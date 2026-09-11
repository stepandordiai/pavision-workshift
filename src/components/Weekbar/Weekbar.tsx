import classNames from "classnames";
import "./Weekbar.scss";

// TODO: learn this
const toLocalDateString = (date: Date) => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

const weekData = [
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
	"Sunday",
];

type WeekbarProps = {
	shiftDate: string;
	// TODO: learn this
	setShiftDate: React.Dispatch<React.SetStateAction<string>>;
	isWeek: boolean;
	setIsWeek: React.Dispatch<React.SetStateAction<boolean>>;
	isMonth: boolean;
	setIsMonth: React.Dispatch<React.SetStateAction<boolean>>;
};

const Weekbar = ({
	shiftDate,
	setShiftDate,
	isWeek,
	setIsWeek,
	isMonth,
	setIsMonth,
}: WeekbarProps) => {
	const today = new Date();
	const dayOfWeek = today.getDay();

	const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
	const monday = new Date(today);
	monday.setDate(today.getDate() + diffToMonday);

	const schedule = [];

	for (let i = 0; i < 7; i++) {
		const currentDate = new Date(monday);
		currentDate.setDate(monday.getDate() + i);

		schedule.push({
			day: weekData[i],
			date: toLocalDateString(currentDate),
		});
	}

	const handleWeekDay = (date: string) => {
		setShiftDate(date);
		setIsWeek(false);
		setIsMonth(false);
	};

	return (
		<div className="">
			<div className="weekbar-container">
				<div className="weekbar-input-container">
					<span className="weekbar-input-lable">Date</span>
					<input
						className="weekbar__input"
						value={shiftDate}
						onChange={(e) => setShiftDate(e.target.value)}
						type="date"
						// disabled={loading}
					/>
				</div>
				<div className="weekbar-input-container">
					<span className="weekbar-input-lable">Show month shift</span>
					<button
						onClick={() => {
							setIsMonth(true);
							setIsWeek(false);
						}}
						className={classNames("weekbar__btn", {
							"weekbar__btn--selected": isMonth,
						})}
					>
						Month
					</button>
				</div>
				<div className="weekbar-input-container">
					<span className="weekbar-input-lable">Show week shift</span>
					<button
						onClick={() => {
							setIsWeek(true);
							setIsMonth(false);
						}}
						className={classNames("weekbar__btn", {
							"weekbar__btn--selected": isWeek,
						})}
					>
						Week
					</button>
				</div>
				<div className="weekbar-input-container">
					<span className="weekbar-input-lable">Show day shift</span>
					<div
						style={{ display: "flex", gap: "5px", flexWrap: "wrap", flex: 1 }}
					>
						{schedule.map((day, i) => {
							return (
								<button
									key={i}
									onClick={() => handleWeekDay(day.date)}
									className={classNames("weekbar__btn", {
										"weekbar__btn--active":
											day.date === toLocalDateString(new Date()),
										"weekbar__btn--selected":
											day.date === shiftDate && !isWeek && !isMonth,
									})}
								>
									{day.day}
								</button>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
};

export default Weekbar;
