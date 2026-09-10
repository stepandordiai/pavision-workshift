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
	clientId: string;
	clientName: string;
	task: string;
	time: string;
};

type Client = {
	id: string;
	name: string;
	tel: string | null;
	address: string | null;
};

type WeekShift = {
	shiftDate: string;
	startTime: string | null;
	endTime: string | null;
	pauseTime: string | null;
	overTime: string | null;
	workDone: WorkDoneEntry[];
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
	clients: Client[];
};

const DayRow = ({
	day,
	editable,
	loading,
	onDataInput,
	onWorkDoneChange,
	onAddWorkDone,
	onBlurSave,
	clients,
}: DayRowProps) => (
	<div style={{ display: "flex", gap: "5px" }}>
		<div className="workshift__day">
			{getWeekdayName(day.shiftDate)} | {day.shiftDate}
		</div>
		<div
			style={{
				width: "100%",
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
			}}
		>
			<div className="visit-container">
				<div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
					<div className="visit-input-container">
						<p className="workshift__label">Start time</p>
						<div className="workshift__input-wrapper">
							<input
								type="text"
								inputMode="numeric"
								placeholder="HH:mm"
								name="startTime"
								value={day.startTime ?? ""}
								onChange={(e) => {
									const digits = e.target.value.replace(/\D/g, "").slice(0, 4);

									let value = digits;

									if (digits.length === 3) {
										// 945 -> 9:45
										value = `${digits.slice(0, 1)}:${digits.slice(1)}`;
									}

									if (digits.length === 4) {
										// 0945 -> 09:45
										// 1545 -> 15:45
										value = `${digits.slice(0, 2)}:${digits.slice(2)}`;
									}

									onDataInput(day.shiftDate, e.target.name, value);
								}}
								onBlur={(e) => {
									let value = e.target.value;

									// Convert 9:45 → 09:45
									if (/^\d:[0-5]\d$/.test(value)) {
										value = `0${value}`;
										onDataInput(day.shiftDate, "startTime", value);
										onBlurSave(day);
										return;
									}

									const validTime = /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);

									if (!validTime && value !== "") {
										// onDataInput(day.shiftDate, "startTime", "");
										// onBlurSave(day);
										// return;
										value = "";
									}

									onDataInput(day.shiftDate, "startTime", value);

									onBlurSave({
										...day,
										startTime: value,
									});
								}}
								className={classNames("workshift__input", {
									"workshift__input--disabled": !editable || loading,
								})}
								disabled={!editable || loading}
							/>

							<button
								type="button"
								className={classNames("workshift__input-clear", {
									"workshift__input-clear--disabled":
										!day.startTime || !editable || loading,
								})}
								onClick={() => {
									onDataInput(day.shiftDate, "startTime", "");
									onBlurSave({
										...day,
										startTime: "",
									});
								}}
								aria-label="Clear start time"
								disabled={!day.startTime || !editable || loading}
							>
								×
							</button>
						</div>
					</div>
					<div className="visit-input-container">
						<p className="workshift__label">End time</p>
						<div className="workshift__input-wrapper">
							<input
								type="text"
								inputMode="numeric"
								placeholder="hh:mm"
								name="endTime"
								value={day.endTime ?? ""}
								onChange={(e) => {
									const digits = e.target.value.replace(/\D/g, "").slice(0, 4);

									let value = digits;

									if (digits.length === 3) {
										// 945 -> 9:45
										value = `${digits.slice(0, 1)}:${digits.slice(1)}`;
									}

									if (digits.length === 4) {
										// 0945 -> 09:45
										// 1545 -> 15:45
										value = `${digits.slice(0, 2)}:${digits.slice(2)}`;
									}

									onDataInput(day.shiftDate, e.target.name, value);
								}}
								onBlur={(e) => {
									let value = e.target.value;

									// Convert 9:45 → 09:45
									if (/^\d:[0-5]\d$/.test(value)) {
										value = `0${value}`;
										onDataInput(day.shiftDate, "endTime", value);
										onBlurSave(day);
										return;
									}

									const validTime = /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);

									if (!validTime && value !== "") {
										// onDataInput(day.shiftDate, "endTime", "");
										// onBlurSave(day);
										value = "";
										// return;
									}

									onDataInput(day.shiftDate, "endTime", value);

									onBlurSave({
										...day,
										endTime: value,
									});
									// onBlurSave(day);
								}}
								className={classNames("workshift__input", {
									"workshift__input--disabled": !editable || loading,
								})}
								disabled={!editable || loading}
							/>

							<button
								type="button"
								className={classNames("workshift__input-clear", {
									"workshift__input-clear--disabled":
										!day.endTime || !editable || loading,
								})}
								onClick={() => {
									onDataInput(day.shiftDate, "endTime", "");
									onBlurSave({
										...day,
										endTime: "",
									});
								}}
								aria-label="Clear start time"
								disabled={!day.endTime || !editable || loading}
							>
								×
							</button>
						</div>
					</div>
					<div className="visit-input-container">
						<p className="workshift__label">Pause</p>
						<div className="workshift__input-wrapper">
							<input
								type="text"
								inputMode="numeric"
								placeholder="hh:mm"
								name="pauseTime"
								value={day.pauseTime ?? ""}
								onChange={(e) => {
									const digits = e.target.value.replace(/\D/g, "").slice(0, 4);

									let value = digits;

									if (digits.length === 3) {
										// 945 -> 9:45
										value = `${digits.slice(0, 1)}:${digits.slice(1)}`;
									}

									if (digits.length === 4) {
										// 0945 -> 09:45
										// 1545 -> 15:45
										value = `${digits.slice(0, 2)}:${digits.slice(2)}`;
									}

									onDataInput(day.shiftDate, e.target.name, value);
								}}
								onBlur={(e) => {
									let value = e.target.value;

									// Convert 9:45 → 09:45
									if (/^\d:[0-5]\d$/.test(value)) {
										value = `0${value}`;
										onDataInput(day.shiftDate, "pauseTime", value);
										onBlurSave(day);
										return;
									}

									const validTime = /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);

									if (!validTime && value !== "") {
										// onDataInput(day.shiftDate, "pauseTime", "");
										// onBlurSave(day);
										// return;
										value = "";
									}

									onDataInput(day.shiftDate, "pauseTime", value);

									onBlurSave({
										...day,
										pauseTime: value,
									});
								}}
								className={classNames("workshift__input", {
									"workshift__input--disabled": !editable || loading,
								})}
								disabled={!editable || loading}
							/>

							<button
								type="button"
								className={classNames("workshift__input-clear", {
									"workshift__input-clear--disabled":
										!day.pauseTime || !editable || loading,
								})}
								onClick={() => {
									onDataInput(day.shiftDate, "pauseTime", "");
									onBlurSave({
										...day,
										pauseTime: "",
									});
								}}
								aria-label="Clear start time"
								disabled={!day.pauseTime || !editable || loading}
							>
								×
							</button>
						</div>
					</div>
					<div className="visit-input-container">
						<p className="workshift__label">Extra time</p>
						<div className="workshift__input-wrapper">
							<input
								type="text"
								inputMode="numeric"
								placeholder="hh:mm"
								name="overTime"
								value={day.overTime ?? ""}
								onChange={(e) => {
									const digits = e.target.value.replace(/\D/g, "").slice(0, 4);

									let value = digits;

									if (digits.length === 3) {
										// 945 -> 9:45
										value = `${digits.slice(0, 1)}:${digits.slice(1)}`;
									}

									if (digits.length === 4) {
										// 0945 -> 09:45
										// 1545 -> 15:45
										value = `${digits.slice(0, 2)}:${digits.slice(2)}`;
									}

									onDataInput(day.shiftDate, e.target.name, value);
								}}
								onBlur={(e) => {
									let value = e.target.value;

									// Convert 9:45 → 09:45
									if (/^\d:[0-5]\d$/.test(value)) {
										value = `0${value}`;
										onDataInput(day.shiftDate, "overTime", value);
										onBlurSave(day);
										return;
									}

									const validTime = /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);

									if (!validTime && value !== "") {
										// onDataInput(day.shiftDate, "overTime", "");
										// onBlurSave(day);
										// return;
										value = "";
									}
									onDataInput(day.shiftDate, "overTime", value);

									onBlurSave({
										...day,
										overTime: value,
									});
								}}
								className={classNames("workshift__input", {
									"workshift__input--disabled": !editable || loading,
								})}
								disabled={!editable || loading}
							/>

							<button
								type="button"
								className={classNames("workshift__input-clear", {
									"workshift__input-clear--disabled":
										!day.overTime || !editable || loading,
								})}
								onClick={() => {
									onDataInput(day.shiftDate, "overTime", "");
									onBlurSave({
										...day,
										overTime: "",
									});
								}}
								aria-label="Clear start time"
								disabled={!day.overTime || !editable || loading}
							>
								×
							</button>
						</div>
					</div>
				</div>
			</div>
			<div>
				<div className="workshift__grid-container">
					{day.workDone.map((item) => {
						return (
							<div className="workshift__grid" key={item.id}>
								<div style={{ width: "1%", whiteSpace: "nowrap" }}>
									<div className="workshift__label">Client</div>
									<select
										style={{ width: "auto" }}
										className="workshift__input"
										name="clientId"
										value={item.clientId}
										onChange={(e) =>
											// onDataInput(item.id, e.target.name, e.target.value)
											onWorkDoneChange(
												day.shiftDate,
												item.id,
												e.target.name,
												e.target.value,
											)
										}
										onBlur={() => onBlurSave(day)}
										disabled={!editable || loading}
									>
										<option value="">Select client</option>

										{clients.map((client) => (
											<option key={client.id} value={client.id}>
												{client.name}
											</option>
										))}
									</select>
								</div>
								<div>
									<p className="workshift__label">Task</p>
									<AutoGrowTextArea
										value={item.task}
										handleChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
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
								</div>
								<div>
									<p className="workshift__label">Time Spend</p>
									<div className="workshift__input-wrapper">
										<input
											type="text"
											inputMode="numeric"
											placeholder="HH:mm"
											name="time"
											value={item.time}
											onChange={(e) => {
												const digits = e.target.value
													.replace(/\D/g, "")
													.slice(0, 4);

												let value = digits;

												if (digits.length === 3) {
													// 945 -> 9:45
													value = `${digits.slice(0, 1)}:${digits.slice(1)}`;
												}

												if (digits.length === 4) {
													// 0945 -> 09:45
													// 1545 -> 15:45
													value = `${digits.slice(0, 2)}:${digits.slice(2)}`;
												}

												onWorkDoneChange(
													day.shiftDate,
													item.id,
													e.target.name,
													value,
												);
											}}
											onBlur={(e) => {
												let value = e.target.value;

												// 9:45 -> 09:45
												if (/^\d:[0-5]\d$/.test(value)) {
													value = `0${value}`;
												}

												const validTime = /^([01]\d|2[0-3]):([0-5]\d)$/.test(
													value,
												);

												if (!validTime && value !== "") {
													value = "";
												}

												onWorkDoneChange(day.shiftDate, item.id, "time", value);

												const updatedDay = {
													...day,
													workDone: day.workDone.map((work) =>
														work.id === item.id
															? {
																	...work,
																	time: value,
																}
															: work,
													),
												};

												onBlurSave(updatedDay);
											}}
											className={classNames("workshift__input", {
												"workshift__input--disabled": !editable || loading,
											})}
											disabled={!editable || loading}
										/>
										<button
											type="button"
											className={classNames("workshift__input-clear", {
												"workshift__input-clear--disabled":
													!item.time || !editable || loading,
											})}
											onClick={() => {
												const updatedDay = {
													...day,
													workDone: day.workDone.map((work) =>
														work.id === item.id
															? {
																	...work,
																	time: "",
																}
															: work,
													),
												};

												onWorkDoneChange(day.shiftDate, item.id, "time", "");

												onBlurSave(updatedDay);
											}}
											disabled={!item.time || !editable || loading}
										>
											×
										</button>
									</div>
								</div>
							</div>
						);
					})}
				</div>
				<button
					style={{ marginTop: "5px" }}
					className="workshift__btn"
					onClick={() => onAddWorkDone(day.shiftDate)}
				>
					Add separate cient row
				</button>
			</div>
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
	const [clients, setClients] = useState<Client[]>([]);

	// TODO:
	useEffect(() => {
		const fetchClients = async () => {
			const { data, error } = await supabase
				.from("clients")
				.select("id, name, tel, address")
				.order("name");

			if (error) {
				console.error(error);
				return;
			}

			setClients(data ?? []);
		};

		fetchClients();
	}, []);

	const [total, setTotal] = useState("00:00");
	// const [monthInput, setMonthInput] = useState(shiftDate.slice(0, 7));
	// const [month, setMonth] = useState("00:00");
	const editable = currentUser?.id === userId;

	const formatTime = (time?: string | null) => {
		if (!time) return "";

		const [hours, minutes] = time.split(":");

		return `${hours}:${minutes}`;
	};

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
							startTime: formatTime(existing.start_time),
							endTime: formatTime(existing.end_time),
							pauseTime: formatTime(existing.pause_time),
							overTime: formatTime(existing.over_time),
							workDone:
								existing.work_done && existing.work_done.length > 0
									? existing.work_done
									: [
											{
												id: crypto.randomUUID(),
												clientId: "",
												clientName: "",
												task: "",
												time: "",
											},
										],
						};
					}
					return {
						shiftDate: date,
						startTime: "",
						endTime: "",
						pauseTime: "",
						overTime: "",
						workDone: [
							{
								id: crypto.randomUUID(),
								cllientId: "",
								clientName: "",
								task: "",
								time: "",
							},
						],
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
							startTime: formatTime(existing.start_time),
							endTime: formatTime(existing.end_time),
							pauseTime: formatTime(existing.pause_time),
							overTime: formatTime(existing.over_time),
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
						startTime: formatTime(shift.start_time),
						endTime: formatTime(shift.end_time),
						overTime: formatTime(shift.over_time),
						pauseTime: formatTime(shift.pause_time),
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
								clientId: "",
								clientName: "",
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

	// TODO:
	const isValidTime = (time?: string) => {
		return /^([01]\d|2[0-3]):[0-5]\d$/.test(time || "");
	};

	useEffect(() => {
		if (!isValidTime(data.startTime) || !isValidTime(data.endTime)) {
			setTotal("00:00");
			return;
		}

		const start = timeToMinutes(data.startTime);
		const end = timeToMinutes(data.endTime);

		const over = isValidTime(data.overTime) ? timeToMinutes(data.overTime) : 0;

		const pause = isValidTime(data.pauseTime)
			? timeToMinutes(data.pauseTime)
			: 0;

		const totalMinutes = end - start + over - pause;

		const hours = Math.floor(totalMinutes / 60);
		const minutes = totalMinutes % 60;

		setTotal(`${hours}:${minutes.toString().padStart(2, "0")}`);
	}, [data, shiftDate]);

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
				{
					id: crypto.randomUUID(),
					clientId: "",
					clientName: "",
					task: "",
					time: "",
				},
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
								{
									id: crypto.randomUUID(),
									clientId: "",
									clientName: "",
									task: "",
									time: "",
								},
							],
						}
					: day,
			),
		);
	};

	const upsertWorkShift = async (overrides: Partial<typeof data> = {}) => {
		setLoading(true);
		setError(null);

		try {
			const updatedData = {
				...data,
				...overrides,
			};

			const hasTime =
				!!updatedData.startTime ||
				!!updatedData.endTime ||
				!!updatedData.pauseTime ||
				!!updatedData.overTime;

			// Remove completely empty workDone rows
			const workDoneToSave = updatedData.workDone.filter(
				(item) =>
					item.task?.trim() ||
					item.time?.trim() ||
					item.clientId?.trim() ||
					item.clientName?.trim(),
			);

			// Nothing to save at all
			if (!hasTime) {
				const { error } = await supabase
					.from("shifts")
					.delete()
					.eq("user_id", userId)
					.eq("shift_date", shiftDate);

				if (error) throw error;

				return;
			}

			const { error } = await supabase.from("shifts").upsert(
				{
					user_id: userId,
					shift_date: shiftDate,
					start_time: updatedData.startTime || null,
					end_time: updatedData.endTime || null,
					pause_time: updatedData.pauseTime || null,
					over_time: updatedData.overTime || null,
					work_done: workDoneToSave,
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

	const upsertWeekWorkShift = async (day: WeekShift) => {
		setLoading(true);
		setError(null);
		try {
			const hasTime =
				!!day.startTime || !!day.endTime || !!day.pauseTime || !!day.overTime;

			const workDoneToSave = day.workDone.filter(
				(item) =>
					item.task?.trim() ||
					item.time?.trim() ||
					item.clientId?.trim() ||
					item.clientName?.trim(),
			);

			if (!hasTime) {
				const { error } = await supabase
					.from("shifts")
					.delete()
					.eq("user_id", userId)
					.eq("shift_date", day.shiftDate);

				if (error) throw error;

				return;
			}

			const { error } = await supabase.from("shifts").upsert(
				{
					user_id: userId,
					shift_date: day.shiftDate,
					start_time: day.startTime || null,
					end_time: day.endTime || null,
					pause_time: day.pauseTime || null,
					over_time: day.overTime || null,
					work_done: workDoneToSave,
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

	const upsertMonthWorkShift = async (day: WeekShift) => {
		setLoading(true);
		setError(null);
		try {
			const hasTime =
				!!day.startTime || !!day.endTime || !!day.pauseTime || !!day.overTime;

			const workDoneToSave = day.workDone.filter(
				(item) =>
					item.task?.trim() ||
					item.time?.trim() ||
					item.clientId?.trim() ||
					item.clientName?.trim(),
			);

			if (!hasTime) {
				const { error } = await supabase
					.from("shifts")
					.delete()
					.eq("user_id", userId)
					.eq("shift_date", day.shiftDate);

				if (error) throw error;

				return;
			}

			const { error } = await supabase.from("shifts").upsert(
				{
					user_id: userId,
					shift_date: day.shiftDate,
					start_time: day.startTime || null,
					end_time: day.endTime || null,
					pause_time: day.pauseTime || null,
					over_time: day.overTime || null,
					work_done: workDoneToSave,
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
								{
									id: crypto.randomUUID(),
									clientId: "",
									clientName: "",
									task: "",
									time: "",
								},
							],
						}
					: day,
			),
		);
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
						clients={clients}
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
						clients={clients}
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
						<div className="workshift__input-wrapper">
							<input
								type="text"
								inputMode="numeric"
								placeholder="HH:mm"
								name="startTime"
								value={data.startTime}
								onChange={(e) => {
									const digits = e.target.value.replace(/\D/g, "").slice(0, 4);

									let value = digits;

									if (digits.length === 3) {
										// 945 -> 9:45
										value = `${digits.slice(0, 1)}:${digits.slice(1)}`;
									}

									if (digits.length === 4) {
										// 0945 -> 09:45
										// 1545 -> 15:45
										value = `${digits.slice(0, 2)}:${digits.slice(2)}`;
									}

									handleDataInput(e.target.name, value);
								}}
								onBlur={(e) => {
									let value = e.target.value;

									// Convert 9:45 → 09:45
									if (/^\d:[0-5]\d$/.test(value)) {
										value = `0${value}`;
										handleDataInput("startTime", value);
										upsertWorkShift({ startTime: value });
										return;
									}

									const validTime = /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);

									if (!validTime && value !== "") {
										handleDataInput("startTime", "");
										upsertWorkShift({ startTime: "" });
										return;
									}

									upsertWorkShift();
								}}
								className={classNames("workshift__input", {
									"workshift__input--disabled": !editable || loading,
								})}
								disabled={!editable || loading}
							/>

							<button
								type="button"
								className={classNames("workshift__input-clear", {
									"workshift__input-clear--disabled":
										!data.startTime || !editable || loading,
								})}
								onClick={() => {
									handleDataInput("startTime", "");
									upsertWorkShift({ startTime: "" });
								}}
								aria-label="Clear start time"
								disabled={!data.startTime || !editable || loading}
							>
								×
							</button>
						</div>
					</div>
					<div className="visit-input-container">
						<span className="workshift__label">End time</span>
						<div className="workshift__input-wrapper">
							<input
								type="text"
								inputMode="numeric"
								placeholder="HH:mm"
								name="endTime"
								value={data.endTime}
								onChange={(e) => {
									const digits = e.target.value.replace(/\D/g, "").slice(0, 4);

									let value = digits;

									if (digits.length === 3) {
										// 945 -> 9:45
										value = `${digits.slice(0, 1)}:${digits.slice(1)}`;
									}

									if (digits.length === 4) {
										// 0945 -> 09:45
										// 1545 -> 15:45
										value = `${digits.slice(0, 2)}:${digits.slice(2)}`;
									}

									handleDataInput(e.target.name, value);
								}}
								onBlur={(e) => {
									let value = e.target.value;

									// Convert 9:45 → 09:45
									if (/^\d:[0-5]\d$/.test(value)) {
										value = `0${value}`;
										handleDataInput("endTime", value);
										upsertWorkShift({ endTime: value });
										return;
									}

									const validTime = /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);

									if (!validTime && value !== "") {
										handleDataInput("endTime", "");
										upsertWorkShift({ endTime: "" });
										return;
									}

									upsertWorkShift();
								}}
								className={classNames("workshift__input", {
									"workshift__input--disabled": !editable || loading,
								})}
								disabled={!editable || loading}
							/>

							<button
								type="button"
								className={classNames("workshift__input-clear", {
									"workshift__input-clear--disabled":
										!data.endTime || !editable || loading,
								})}
								onClick={() => {
									handleDataInput("endTime", "");
									upsertWorkShift({ endTime: "" });
								}}
								aria-label="Clear start time"
								disabled={!data.endTime || !editable || loading}
							>
								×
							</button>
						</div>
					</div>
					<div className="visit-input-container">
						<span className="workshift__label">Pause time</span>
						<div className="workshift__input-wrapper">
							<input
								type="text"
								inputMode="numeric"
								placeholder="HH:mm"
								name="pauseTime"
								value={data.pauseTime}
								onChange={(e) => {
									const digits = e.target.value.replace(/\D/g, "").slice(0, 4);

									let value = digits;

									if (digits.length === 3) {
										// 945 -> 9:45
										value = `${digits.slice(0, 1)}:${digits.slice(1)}`;
									}

									if (digits.length === 4) {
										// 0945 -> 09:45
										// 1545 -> 15:45
										value = `${digits.slice(0, 2)}:${digits.slice(2)}`;
									}

									handleDataInput(e.target.name, value);
								}}
								onBlur={(e) => {
									let value = e.target.value;

									// Convert 9:45 → 09:45
									if (/^\d:[0-5]\d$/.test(value)) {
										value = `0${value}`;
										handleDataInput("pauseTime", value);
										upsertWorkShift({ pauseTime: value });
										return;
									}

									const validTime = /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);

									if (!validTime && value !== "") {
										handleDataInput("pauseTime", "");
										upsertWorkShift({ pauseTime: "" });
										return;
									}

									upsertWorkShift();
								}}
								className={classNames("workshift__input", {
									"workshift__input--disabled": !editable || loading,
								})}
								disabled={!editable || loading}
							/>

							<button
								type="button"
								className={classNames("workshift__input-clear", {
									"workshift__input-clear--disabled":
										!data.pauseTime || !editable || loading,
								})}
								onClick={() => {
									handleDataInput("pauseTime", "");
									upsertWorkShift({ pauseTime: "" });
								}}
								aria-label="Clear start time"
								disabled={!data.pauseTime || !editable || loading}
							>
								×
							</button>
						</div>
					</div>
					<div className="visit-input-container">
						<span className="workshift__label">Extra time</span>
						<div className="workshift__input-wrapper">
							<input
								type="text"
								inputMode="numeric"
								placeholder="HH:mm"
								name="overTime"
								value={data.overTime}
								onChange={(e) => {
									const digits = e.target.value.replace(/\D/g, "").slice(0, 4);

									let value = digits;

									if (digits.length === 3) {
										// 945 -> 9:45
										value = `${digits.slice(0, 1)}:${digits.slice(1)}`;
									}

									if (digits.length === 4) {
										// 0945 -> 09:45
										// 1545 -> 15:45
										value = `${digits.slice(0, 2)}:${digits.slice(2)}`;
									}

									handleDataInput(e.target.name, value);
								}}
								onBlur={(e) => {
									let value = e.target.value;

									// Convert 9:45 → 09:45
									if (/^\d:[0-5]\d$/.test(value)) {
										value = `0${value}`;
										handleDataInput("overTime", value);
										upsertWorkShift({ overTime: value });
										return;
									}

									const validTime = /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);

									if (!validTime && value !== "") {
										handleDataInput("overTime", "");
										upsertWorkShift({ overTime: "" });
										return;
									}

									upsertWorkShift();
								}}
								className={classNames("workshift__input", {
									"workshift__input--disabled": !editable || loading,
								})}
								disabled={!editable || loading}
							/>
							<button
								type="button"
								className={classNames("workshift__input-clear", {
									"workshift__input-clear--disabled":
										!data.overTime || !editable || loading,
								})}
								onClick={() => {
									handleDataInput("overTime", "");
									upsertWorkShift({ overTime: "" });
								}}
								aria-label="Clear start time"
								disabled={!data.overTime || !editable || loading}
							>
								×
							</button>
						</div>
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
						<p className="workshift__input">{total}</p>
					</div>
				</div>
			</div>
			<div className="workshift__grid-container">
				{data.workDone.map((item) => {
					return (
						<div className="workshift__grid" key={item.id}>
							<div style={{ width: "1%", whiteSpace: "nowrap" }}>
								<div className="workshift__label">Client</div>
								<select
									style={{ width: "auto" }}
									className="workshift__input"
									name="clientId"
									value={item.clientId}
									onChange={(e) =>
										handleChangeInput(item.id, e.target.name, e.target.value)
									}
									onBlur={() => upsertWorkShift()}
									disabled={!editable || loading}
								>
									<option value="">Select client</option>

									{clients.map((client) => (
										<option key={client.id} value={client.id}>
											{client.name}
										</option>
									))}
								</select>
							</div>
							<div>
								<p className="workshift__label">Task</p>
								<AutoGrowTextArea
									value={item.task}
									handleChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
										handleChangeInput(item.id, e.target.name, e.target.value)
									}
									name="task"
									blur={() => upsertWorkShift()}
									disable={!editable || loading}
								/>
							</div>
							<div>
								<p className="workshift__label">Time Spend</p>
								<div className="workshift__input-wrapper">
									<input
										type="text"
										inputMode="numeric"
										placeholder="HH:mm"
										name="time"
										value={item.time}
										onChange={(e) => {
											const digits = e.target.value
												.replace(/\D/g, "")
												.slice(0, 4);

											let value = digits;

											if (digits.length === 3) {
												// 945 -> 9:45
												value = `${digits.slice(0, 1)}:${digits.slice(1)}`;
											}

											if (digits.length === 4) {
												// 0945 -> 09:45
												// 1545 -> 15:45
												value = `${digits.slice(0, 2)}:${digits.slice(2)}`;
											}

											handleChangeInput(item.id, e.target.name, value);
										}}
										onBlur={(e) => {
											let value = e.target.value;

											// Convert 9:45 → 09:45
											if (/^\d:[0-5]\d$/.test(value)) {
												value = `0${value}`;
											}

											const validTime = /^([01]\d|2[0-3]):([0-5]\d)$/.test(
												value,
											);

											if (!validTime && value !== "") {
												value = "";
											}

											const updatedWorkDone = data.workDone.map((work) =>
												work.id === item.id
													? {
															...work,
															time: value,
														}
													: work,
											);

											setData((prev) => ({
												...prev,
												workDone: updatedWorkDone,
											}));

											upsertWorkShift({
												workDone: updatedWorkDone,
											});
										}}
										className={classNames("workshift__input", {
											"workshift__input--disabled": !editable || loading,
										})}
										disabled={!editable || loading}
									/>
									<button
										type="button"
										className={classNames("workshift__input-clear", {
											"workshift__input-clear--disabled":
												!item.time || !editable || loading,
										})}
										onClick={() => {
											const updatedWorkDone = data.workDone.map((work) =>
												work.id === item.id
													? {
															...work,
															time: "",
														}
													: work,
											);

											setData((prev) => ({
												...prev,
												workDone: updatedWorkDone,
											}));

											upsertWorkShift({
												workDone: updatedWorkDone,
											});
										}}
										disabled={!item.time || !editable || loading}
									>
										×
									</button>
								</div>
							</div>
						</div>
					);
				})}
			</div>
			<button className="workshift__btn" onClick={addWorkDoneEntry}>
				Add separate cient row
			</button>
			<StatusIndicator loading={loading} error={error} />
		</section>
	);
};

export default Visit;
