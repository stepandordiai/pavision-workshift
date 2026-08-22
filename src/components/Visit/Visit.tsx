import { useEffect, useState } from "react";
import timeToMinutes from "../../utils/timeToMinutes";
import StatusIndicator from "../StatusIndicator/StatusIndicator";
// import ClockIcon from "../../icons/ClockIcon";
import ClockIcon from "../icons/ClockIcon";
import classNames from "classnames";
import { supabase } from "../../lib/supabase";
import AutoGrowTextArea from "../AutoGrowTextArea/AutoGrowTextArea";
import "./Visit.scss";

type VisitProps = {
	userId: string | undefined;
	currentUser: {
		id: string;
	} | null;
	shiftDate: string;
	// setShiftDate: React.Dispatch<React.SetStateAction<boolean>>;
	isWeek: boolean;
	isMonth: boolean;
};

type WorkDoneEntry = {
	id: string;
	task: string;
	time: string;
};

// TODO: learn this
const getWeekdayName = (dateStr: string) => {
	const date = new Date(dateStr);
	return date.toLocaleDateString("en-US", { weekday: "long" });
};

const toLocalDateString = (date: Date) => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

type WeekShift = {
	shiftDate: string;
	startTime: string | null;
	endTime: string | null;
	pauseTime: string | null;
	overTime: string | null;
	workDone: WorkDoneEntry[];
};

type DayRowProps = {
	day: WeekShift;
	editable: boolean;
	loading: boolean;
	onDataInput: (shiftDate: string, name: string, value: string) => void;
	onWorkDoneChange: (
		shiftDate: string,
		id: string,
		name: string,
		value: string,
	) => void;
	onAddWorkDone: (shiftDate: string) => void;
	onBlurSave: (day: WeekShift) => void;
};

const DayRow = ({
	day,
	editable,
	loading,
	onDataInput,
	onWorkDoneChange,
	onAddWorkDone,
	onBlurSave,
}: DayRowProps) => (
	<div style={{ display: "flex", gap: "5px" }}>
		<div className="workshift__day">
			{getWeekdayName(day.shiftDate)} | {day.shiftDate}
		</div>
		<div style={{ width: "100%" }}>
			<div className="visit-container">
				<div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
					<div className="visit-input-container">
						<span className="workshift__label">Start time</span>
						<input
							onChange={(e) =>
								onDataInput(day.shiftDate, e.target.name, e.target.value)
							}
							onBlur={() => onBlurSave(day)}
							name="startTime"
							value={day.startTime ?? ""}
							className={classNames("workshift__input", {
								"workshift__input--disabled": !editable || loading,
							})}
							disabled={!editable || loading}
							type="time"
						/>
					</div>
					<div className="visit-input-container">
						<span className="workshift__label">End time</span>
						<input
							onChange={(e) =>
								onDataInput(day.shiftDate, e.target.name, e.target.value)
							}
							onBlur={() => onBlurSave(day)}
							name="endTime"
							className={classNames("workshift__input", {
								"workshift__input--disabled": !editable || loading,
							})}
							value={day.endTime ?? ""}
							disabled={!editable || loading}
							type="time"
						/>
					</div>
					<div className="visit-input-container">
						<span className="workshift__label">Pause</span>
						<input
							onChange={(e) =>
								onDataInput(day.shiftDate, e.target.name, e.target.value)
							}
							onBlur={() => onBlurSave(day)}
							name="pauseTime"
							className={classNames("workshift__input", {
								"workshift__input--disabled": !editable || loading,
							})}
							value={day.pauseTime ?? ""}
							type="time"
							disabled={!editable || loading}
						/>
					</div>
					<div className="visit-input-container">
						<span className="workshift__label">Extra time</span>
						<input
							onChange={(e) =>
								onDataInput(day.shiftDate, e.target.name, e.target.value)
							}
							onBlur={() => onBlurSave(day)}
							name="overTime"
							className={classNames("workshift__input", {
								"workshift__input--disabled": !editable || loading,
							})}
							value={day.overTime ?? ""}
							type="time"
							disabled={!editable || loading}
						/>
					</div>
				</div>
			</div>

			<table className="workshift__table">
				<thead>
					<tr>
						<th className="workshift__label">Task</th>
						<th className="workshift__label">Time</th>
					</tr>
				</thead>
				<tbody>
					{day.workDone.map((item) => (
						<tr key={item.id}>
							<td>
								<AutoGrowTextArea
									value={item.task}
									handleChange={(e) =>
										onWorkDoneChange(
											day.shiftDate,
											item.id,
											e.target.name,
											e.target.value,
										)
									}
									name="task"
									blur={() => onBlurSave(day)}
									disable={!editable || loading}
								/>
							</td>
							<td>
								<input
									onChange={(e) =>
										onWorkDoneChange(
											day.shiftDate,
											item.id,
											e.target.name,
											e.target.value,
										)
									}
									value={item.time}
									className={classNames("workshift__input", {
										"workshift__input--disabled": !editable || loading,
									})}
									type="time"
									name="time"
									onBlur={() => onBlurSave(day)}
									disabled={!editable || loading}
								/>
							</td>
						</tr>
					))}
				</tbody>
			</table>
			<button
				className="workshift__btn"
				onClick={() => onAddWorkDone(day.shiftDate)}
			>
				Add
			</button>
		</div>
	</div>
);

const Visit = ({
	userId,
	currentUser,
	shiftDate,
	// setShiftDate,
	isWeek,
	isMonth,
}: VisitProps) => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [data, setData] = useState({
		startTime: "",
		endTime: "",
		pauseTime: "",
		overTime: "",
		workDone: [] as WorkDoneEntry[],
	});

	const [weekShifts, setWeekShifts] = useState<WeekShift[]>([]);
	const [weekLoading, setWeekLoading] = useState(false);
	const [monthShifts, setMonthShifts] = useState<WeekShift[]>([]);
	const [monthLoading, setMonthLoading] = useState(false);

	const [total, setTotal] = useState("00:00");
	// const [monthInput, setMonthInput] = useState(shiftDate.slice(0, 7));
	// const [month, setMonth] = useState("00:00");
	const editable = currentUser?.id === userId;

	console.log(editable);

	useEffect(() => {
		if (!isWeek || !userId) return;

		const weekDates = getWeekDates(shiftDate);
		const from = weekDates[0];
		const to = weekDates[6];

		const fetchWeekShifts = async () => {
			setWeekLoading(true);
			setError(null);

			try {
				const { data: shifts, error } = await supabase
					.from("shifts")
					.select(
						"shift_date, start_time, end_time, pause_time, over_time, work_done",
					)
					.eq("user_id", userId)
					.gte("shift_date", from)
					.lte("shift_date", to);

				if (error) throw error;

				// fill in missing days so every day in the week renders a row
				const merged = weekDates.map((date) => {
					const existing = shifts?.find((s) => s.shift_date === date);
					if (existing) {
						return {
							shiftDate: existing.shift_date,
							startTime: existing.start_time,
							endTime: existing.end_time,
							pauseTime: existing.pause_time,
							overTime: existing.over_time,
							workDone:
								existing.work_done && existing.work_done.length > 0
									? existing.work_done
									: [{ id: crypto.randomUUID(), task: "", time: "" }],
						};
					}
					return {
						shiftDate: date,
						startTime: "",
						endTime: "",
						pauseTime: "",
						overTime: "",
						workDone: [{ id: crypto.randomUUID(), task: "", time: "" }],
					};
				});

				setWeekShifts(merged);
			} catch (err: any) {
				setError(err.message);
			} finally {
				setWeekLoading(false);
			}
		};

		fetchWeekShifts();
	}, [isWeek, shiftDate, userId]);

	useEffect(() => {
		if (!isMonth || !userId) return;

		const monthDates = getMonthDates(shiftDate);
		const from = monthDates[0];
		const to = monthDates[monthDates.length - 1];

		const fetchMonthShifts = async () => {
			setMonthLoading(true);
			setError(null);

			try {
				const { data: shifts, error } = await supabase
					.from("shifts")
					.select(
						"shift_date, start_time, end_time, pause_time, over_time, work_done",
					)
					.eq("user_id", userId)
					.gte("shift_date", from)
					.lte("shift_date", to);

				if (error) throw error;

				const merged = monthDates.map((date) => {
					const existing = shifts?.find((s) => s.shift_date === date);
					if (existing) {
						return {
							shiftDate: existing.shift_date,
							startTime: existing.start_time,
							endTime: existing.end_time,
							pauseTime: existing.pause_time,
							overTime: existing.over_time,
							workDone:
								existing.work_done && existing.work_done.length > 0
									? existing.work_done
									: [{ id: crypto.randomUUID(), task: "", time: "" }],
						};
					}
					return {
						shiftDate: date,
						startTime: "",
						endTime: "",
						pauseTime: "",
						overTime: "",
						workDone: [{ id: crypto.randomUUID(), task: "", time: "" }],
					};
				});

				setMonthShifts(merged);
			} catch (err: any) {
				setError(err.message);
			} finally {
				setMonthLoading(false);
			}
		};

		fetchMonthShifts();
	}, [isMonth, shiftDate, userId]);

	useEffect(() => {
		const fetchWorkShift = async () => {
			setError(null);
			setLoading(true);
			setTotal("00:00");

			try {
				const { data: shift, error } = await supabase
					.from("shifts")
					.select("start_time, end_time, pause_time, over_time, work_done")
					.eq("user_id", userId)
					.eq("shift_date", shiftDate)
					.maybeSingle();

				if (error) throw error;

				if (shift) {
					setData({
						startTime: shift.start_time ?? "",
						endTime: shift.end_time ?? "",
						overTime: shift.over_time ?? "",
						pauseTime: shift.pause_time ?? "",
						workDone:
							shift.work_done && shift.work_done.length > 0
								? shift.work_done
								: [{ id: crypto.randomUUID(), task: "", time: "" }],
					});
				} else {
					// no row yet for this date — reset to empty
					setData({
						startTime: "",
						endTime: "",
						overTime: "",
						pauseTime: "",
						workDone: [
							{
								id: crypto.randomUUID(),
								task: "",
								time: "",
							},
						],
					});
				}
			} catch (err: any) {
				setError(err.message);
			} finally {
				setLoading(false);
			}
		};

		if (userId && shiftDate) {
			fetchWorkShift();
		}
	}, [userId, shiftDate]);

	useEffect(() => {
		if (data.startTime && data.endTime) {
			const start = timeToMinutes(data.startTime);
			const end = timeToMinutes(data.endTime);
			const over = timeToMinutes(data.overTime);
			const pause = timeToMinutes(data.pauseTime);

			const hours = Math.floor((end - start + over - pause) / 60);
			const minutes = (end - start + over - pause) % 60;

			setTotal(hours + ":" + minutes.toString().padStart(2, "0"));
		} else {
			setTotal("00:00");
		}
	}, [data, shiftDate]);

	const upsertWorkShift = async () => {
		setLoading(true);
		setError(null);
		try {
			const { error } = await supabase.from("shifts").upsert(
				{
					user_id: userId,
					shift_date: shiftDate,
					start_time: data.startTime || null,
					end_time: data.endTime || null,
					pause_time: data.pauseTime || null,
					over_time: data.overTime || null,
					work_done: data.workDone,
				},
				{ onConflict: "user_id,shift_date" },
			);

			if (error) throw error;
		} catch (error: any) {
			setError(error.message);
		} finally {
			setLoading(false);
		}
	};

	// useEffect(() => {
	// 	const fetchMonthData = async () => {
	// 		setLoading(true);
	// 		setError(null);
	// 		setMonth("00:00");

	// 		try {
	// 			const res = await api.get("/api/work/monthly", {
	// 				params: { month: monthInput, userId },
	// 			});

	// 			setMonth(res.data);
	// 		} catch (error) {
	// 			setError(error.message);
	// 		} finally {
	// 			setLoading(false);
	// 		}
	// 	};

	// 	fetchMonthData();
	// }, [monthInput, userId]);

	const handleDataInput = (name: string, value: any) => {
		setData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const addWorkDoneEntry = () => {
		setData((prev) => ({
			...prev,
			workDone: [
				...prev.workDone,
				{ id: crypto.randomUUID(), task: "", time: "" },
			],
		}));
	};

	const handleChangeInput = (id: string, name: string, value: string) => {
		setData((prev) => ({
			...prev,
			workDone: prev.workDone.map((item) =>
				item.id === id ? { ...item, [name]: value } : item,
			),
		}));
	};

	const getWeekDates = (dateStr: string) => {
		const date = new Date(dateStr);
		const day = date.getDay(); // 0 = Sunday, 1 = Monday, ...
		const diffToMonday = day === 0 ? -6 : 1 - day;

		const monday = new Date(date);
		monday.setDate(date.getDate() + diffToMonday);

		return Array.from({ length: 7 }, (_, i) => {
			const d = new Date(monday);
			d.setDate(monday.getDate() + i);
			return toLocalDateString(d);
		});
	};

	const handleWeekDataInput = (
		shiftDate: string,
		name: string,
		value: string,
	) => {
		setWeekShifts((prev) =>
			prev.map((day) =>
				day.shiftDate === shiftDate ? { ...day, [name]: value } : day,
			),
		);
	};

	const handleWeekWorkDoneChange = (
		shiftDate: string,
		id: string,
		name: string,
		value: string,
	) => {
		setWeekShifts((prev) =>
			prev.map((day) =>
				day.shiftDate === shiftDate
					? {
							...day,
							workDone: day.workDone.map((item) =>
								item.id === id ? { ...item, [name]: value } : item,
							),
						}
					: day,
			),
		);
	};

	const addWeekWorkDoneEntry = (shiftDate: string) => {
		setWeekShifts((prev) =>
			prev.map((day) =>
				day.shiftDate === shiftDate
					? {
							...day,
							workDone: [
								...day.workDone,
								{ id: crypto.randomUUID(), task: "", time: "" },
							],
						}
					: day,
			),
		);
	};

	const upsertWeekWorkShift = async (day: WeekShift) => {
		setLoading(true);
		setError(null);
		try {
			const { error } = await supabase.from("shifts").upsert(
				{
					user_id: userId,
					shift_date: day.shiftDate,
					start_time: day.startTime || null,
					end_time: day.endTime || null,
					pause_time: day.pauseTime || null,
					over_time: day.overTime || null,
					work_done: day.workDone,
				},
				{ onConflict: "user_id,shift_date" },
			);

			if (error) throw error;
		} catch (err: any) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	// Month

	const getMonthDates = (dateStr: string) => {
		const [year, month] = dateStr.split("-").map(Number);
		const daysInMonth = new Date(year, month, 0).getDate();

		return Array.from({ length: daysInMonth }, (_, i) => {
			const d = new Date(year, month - 1, i + 1);
			return toLocalDateString(d);
		});
	};

	const handleMonthDataInput = (
		shiftDate: string,
		name: string,
		value: string,
	) => {
		setMonthShifts((prev) =>
			prev.map((day) =>
				day.shiftDate === shiftDate ? { ...day, [name]: value } : day,
			),
		);
	};

	const handleMonthWorkDoneChange = (
		shiftDate: string,
		id: string,
		name: string,
		value: string,
	) => {
		setMonthShifts((prev) =>
			prev.map((day) =>
				day.shiftDate === shiftDate
					? {
							...day,
							workDone: day.workDone.map((item) =>
								item.id === id ? { ...item, [name]: value } : item,
							),
						}
					: day,
			),
		);
	};

	const addMonthWorkDoneEntry = (shiftDate: string) => {
		setMonthShifts((prev) =>
			prev.map((day) =>
				day.shiftDate === shiftDate
					? {
							...day,
							workDone: [
								...day.workDone,
								{ id: crypto.randomUUID(), task: "", time: "" },
							],
						}
					: day,
			),
		);
	};

	const upsertMonthWorkShift = async (day: WeekShift) => {
		setLoading(true);
		setError(null);
		try {
			const { error } = await supabase.from("shifts").upsert(
				{
					user_id: userId,
					shift_date: day.shiftDate,
					start_time: day.startTime || null,
					end_time: day.endTime || null,
					pause_time: day.pauseTime || null,
					over_time: day.overTime || null,
					work_done: day.workDone,
				},
				{ onConflict: "user_id,shift_date" },
			);

			if (error) throw error;
		} catch (err: any) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	if (!currentUser) return <p>Loading...</p>; // wait for context to hydrate
	// const editable = currentUser.id === userId;

	if (isWeek) {
		return (
			<section className="section">
				<div className="section__heading-container">
					<ClockIcon size={20} />
					<h2 className="section__heading">Workshift for the week</h2>
				</div>
				{weekShifts.map((day) => (
					<DayRow
						key={day.shiftDate}
						day={day}
						editable={editable}
						loading={loading}
						onDataInput={handleWeekDataInput}
						onWorkDoneChange={handleWeekWorkDoneChange}
						onAddWorkDone={addWeekWorkDoneEntry}
						onBlurSave={upsertWeekWorkShift}
					/>
				))}
				<StatusIndicator loading={weekLoading} error={error} />
			</section>
		);
	}

	if (isMonth) {
		return (
			<section className="section">
				<div className="section__heading-container">
					<ClockIcon size={20} />
					<h2 className="section__heading">Workshift for the month</h2>
				</div>
				{monthShifts.map((day) => (
					<DayRow
						key={day.shiftDate}
						day={day}
						editable={editable}
						loading={loading}
						onDataInput={handleMonthDataInput}
						onWorkDoneChange={handleMonthWorkDoneChange}
						onAddWorkDone={addMonthWorkDoneEntry}
						onBlurSave={upsertMonthWorkShift}
					/>
				))}
				<StatusIndicator loading={monthLoading} error={error} />
			</section>
		);
	}

	return (
		<section className="section">
			<div className="section__heading-container">
				<ClockIcon size={20} />
				<h2 className="section__heading">Workshift</h2>
			</div>
			<div className="visit-container">
				<div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
					<div className="visit-input-container">
						<span className="workshift__label">Start time</span>
						<input
							onChange={(e) => handleDataInput(e.target.name, e.target.value)}
							name="startTime"
							onBlur={upsertWorkShift}
							value={data.startTime}
							className={classNames("workshift__input", {
								"workshift__input--disabled": !editable || loading,
							})}
							disabled={!editable || loading}
							type="time"
						/>
					</div>
					<div className="visit-input-container">
						<span className="workshift__label">End time</span>
						<input
							onChange={(e) => handleDataInput(e.target.name, e.target.value)}
							name="endTime"
							onBlur={upsertWorkShift}
							className={classNames("workshift__input", {
								"workshift__input--disabled": !editable || loading,
							})}
							value={data.endTime}
							disabled={!editable || loading}
							type="time"
						/>
					</div>
					<div className="visit-input-container">
						<span className="workshift__label">Pause</span>
						<input
							onChange={(e) => handleDataInput(e.target.name, e.target.value)}
							name="pauseTime"
							onBlur={upsertWorkShift}
							className={classNames("workshift__input", {
								"workshift__input--disabled": !editable || loading,
							})}
							value={data.pauseTime}
							type="time"
							disabled={!editable || loading}
						/>
					</div>
					<div className="visit-input-container">
						<span className="workshift__label">Extra time</span>
						<input
							onChange={(e) => handleDataInput(e.target.name, e.target.value)}
							name="overTime"
							onBlur={upsertWorkShift}
							className={classNames("workshift__input", {
								"workshift__input--disabled": !editable || loading,
							})}
							value={data.overTime}
							type="time"
							disabled={!editable || loading}
						/>
					</div>
				</div>
				<div
					style={{
						display: "flex",
						justifyContent: "flex-end",
						gap: 5,
						flexWrap: "wrap",
					}}
				>
					<div className="visit-input-container">
						<span className="workshift__label">Total</span>
						<p>{total}</p>
					</div>
				</div>
			</div>
			<table className="workshift__table">
				<thead>
					<tr>
						<th className="workshift__label">Task</th>
						<th className="workshift__label">Time</th>
					</tr>
				</thead>
				<tbody>
					{data.workDone.map((item) => {
						return (
							<tr key={item.id}>
								<td>
									<AutoGrowTextArea
										value={item.task}
										handleChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
											handleChangeInput(item.id, e.target.name, e.target.value)
										}
										name="task"
										blur={upsertWorkShift}
										disable={!editable || loading}
									/>
								</td>
								<td>
									<input
										onChange={(e) =>
											handleChangeInput(item.id, e.target.name, e.target.value)
										}
										value={item.time}
										className={classNames("workshift__input", {
											"workshift__input--disabled": !editable || loading,
										})}
										type="time"
										name="time"
										onBlur={upsertWorkShift}
										disabled={!editable || loading}
									/>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
			<button className="workshift__btn" onClick={addWorkDoneEntry}>
				Add
			</button>
			<StatusIndicator loading={loading} error={error} />
		</section>
	);
};

export default Visit;
