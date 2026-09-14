import { useEffect, useState } from "react";
import timeToMinutes from "../../utils/timeToMinutes";
import ClockIcon from "../icons/ClockIcon";
import classNames from "classnames";
import { supabase } from "../../lib/supabase";
import AutoGrowTextArea from "../AutoGrowTextArea/AutoGrowTextArea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import "./Visit.scss";

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

const parseLocalDate = (dateStr: string) => {
	const [year, month, day] = dateStr.split("-").map(Number);

	return new Date(year, month - 1, day);
};

const toLocalDateString = (date: Date) => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

// TODO: learn this
const getWeekdayName = (dateStr: string) => {
	const date = parseLocalDate(dateStr);
	return date.toLocaleDateString("en-US", { weekday: "long" });
};

// Get current week dates
const getWeekDates = (dateStr: string) => {
	const date = parseLocalDate(dateStr);
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

// Get current month dates
const getMonthDates = (dateStr: string) => {
	const [year, month] = dateStr.split("-").map(Number);
	const daysInMonth = new Date(year, month, 0).getDate();

	return Array.from({ length: daysInMonth }, (_, i) => {
		const d = new Date(year, month - 1, i + 1);
		return toLocalDateString(d);
	});
};

type DayRowProps = {
	day: WeekShift;
	editable: boolean;
	onDataInput: (shiftDate: string, name: string, value: string) => void;
	onWorkDoneChange: (
		shiftDate: string,
		id: string,
		name: string,
		value: string,
	) => void;
	onAddWorkDone: (shiftDate: string) => void;
	onBlurSave: (day: WeekShift) => Promise<void>;
	clients: Client[];
	saving: boolean;
};

const DayRow = ({
	day,
	editable,
	onDataInput,
	onWorkDoneChange,
	onAddWorkDone,
	onBlurSave,
	clients,
	saving,
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
						<label>Start time</label>
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
									"workshift__input--disabled": !editable || saving,
								})}
								disabled={!editable || saving}
							/>

							<button
								type="button"
								className={classNames("workshift__input-clear", {
									"workshift__input-clear--disabled":
										!day.startTime || !editable || saving,
								})}
								onClick={() => {
									onDataInput(day.shiftDate, "startTime", "");
									onBlurSave({
										...day,
										startTime: "",
									});
								}}
								aria-label="Clear start time"
								disabled={!day.startTime || !editable || saving}
							>
								×
							</button>
						</div>
					</div>
					<div className="visit-input-container">
						<label>End time</label>
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
									"workshift__input--disabled": !editable || saving,
								})}
								disabled={!editable || saving}
							/>

							<button
								type="button"
								className={classNames("workshift__input-clear", {
									"workshift__input-clear--disabled":
										!day.endTime || !editable || saving,
								})}
								onClick={() => {
									onDataInput(day.shiftDate, "endTime", "");
									onBlurSave({
										...day,
										endTime: "",
									});
								}}
								aria-label="Clear start time"
								disabled={!day.endTime || !editable || saving}
							>
								×
							</button>
						</div>
					</div>
					<div className="visit-input-container">
						<label>Pause</label>
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
									"workshift__input--disabled": !editable || saving,
								})}
								disabled={!editable || saving}
							/>

							<button
								type="button"
								className={classNames("workshift__input-clear", {
									"workshift__input-clear--disabled":
										!day.pauseTime || !editable || saving,
								})}
								onClick={() => {
									onDataInput(day.shiftDate, "pauseTime", "");
									onBlurSave({
										...day,
										pauseTime: "",
									});
								}}
								aria-label="Clear start time"
								disabled={!day.pauseTime || !editable || saving}
							>
								×
							</button>
						</div>
					</div>
					<div className="visit-input-container">
						<label>Extra time</label>
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
									"workshift__input--disabled": !editable || saving,
								})}
								disabled={!editable || saving}
							/>

							<button
								type="button"
								className={classNames("workshift__input-clear", {
									"workshift__input-clear--disabled":
										!day.overTime || !editable || saving,
								})}
								onClick={() => {
									onDataInput(day.shiftDate, "overTime", "");
									onBlurSave({
										...day,
										overTime: "",
									});
								}}
								aria-label="Clear start time"
								disabled={!day.overTime || !editable || saving}
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
									<label>Client</label>
									<select
										style={{ width: "auto" }}
										className={classNames("workshift__input", {
											"workshift__input--disabled": !editable || saving,
										})}
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
										disabled={!editable || saving}
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
									<label>Task</label>
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
										disable={!editable || saving}
									/>
								</div>
								<div>
									<label>Time Spend</label>
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
												"workshift__input--disabled": !editable || saving,
											})}
											disabled={!editable || saving}
										/>
										<button
											type="button"
											className={classNames("workshift__input-clear", {
												"workshift__input-clear--disabled":
													!item.time || !editable || saving,
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
											disabled={!item.time || !editable || saving}
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
					className={classNames("workshift__btn", {
						"workshift__btn--disabled": !editable || saving,
					})}
					onClick={() => onAddWorkDone(day.shiftDate)}
					disabled={!editable || saving}
				>
					Add separate cient row
				</button>
			</div>
		</div>
	</div>
);

const formatTime = (time?: string | null) => {
	if (!time) return "";

	const [hours, minutes] = time.split(":");

	return `${hours}:${minutes}`;
};

// TODO:
const isValidTime = (time?: string) => {
	return /^([01]\d|2[0-3]):[0-5]\d$/.test(time || "");
};

type VisitProps = {
	userId: string | undefined;
	currentUser: {
		id: string;
	} | null;
	shiftDate: string;
	// setShiftDate: React.Dispatch<React.SetStateAction<boolean>>;
	isWeek: boolean;
	isMonth: boolean;
	onError: (error: Error | null) => void;
};

const Visit = ({
	userId,
	currentUser,
	shiftDate,
	isWeek,
	isMonth,
	onError,
}: VisitProps) => {
	const queryClient = useQueryClient();
	const [data, setData] = useState({
		startTime: "",
		endTime: "",
		pauseTime: "",
		overTime: "",
		workDone: [] as WorkDoneEntry[],
	});

	const [weekShifts, setWeekShifts] = useState<WeekShift[]>([]);
	const [monthShifts, setMonthShifts] = useState<WeekShift[]>([]);
	const [total, setTotal] = useState("00:00");
	const editable = currentUser?.id === userId;
	const [savingDate, setSavingDate] = useState<string | null>(null);
	const [savingMonthDate, setSavingMonthDate] = useState<string | null>(null);
	const [totalError, setTotalError] = useState<Error | null>(null);

	// TODO: LEARN THIS (FETCH CLIENTS)
	const {
		data: clients = [],
		isLoading: clientsLoading,
		error: fetchClientsError,
	} = useQuery({
		queryKey: ["user-page", userId, "clients"],
		queryFn: async () => {
			const { data, error } = await supabase
				.from("clients")
				.select("id, name, tel, address")
				.order("name");

			if (error) throw error;

			return data ?? [];
		},
	});

	// TODO: LEARN THIS (fetch day shift)
	const {
		data: shift,
		isSuccess,
		error: fetchDayShiftError,
	} = useQuery({
		queryKey: ["user-page", userId, "shift", shiftDate],

		queryFn: async () => {
			const { data, error } = await supabase
				.from("shifts")
				.select("start_time, end_time, pause_time, over_time, work_done")
				.eq("user_id", userId)
				.eq("shift_date", shiftDate)
				.maybeSingle();

			if (error) throw error;

			return data;
		},

		enabled: !!userId && !!shiftDate,
	});

	useEffect(() => {
		if (!isSuccess) return;

		setTotal("00:00");

		if (shift) {
			setData({
				startTime: formatTime(shift.start_time),
				endTime: formatTime(shift.end_time),
				overTime: formatTime(shift.over_time),
				pauseTime: formatTime(shift.pause_time),

				workDone:
					shift.work_done && shift.work_done.length > 0
						? shift.work_done
						: [
								{
									id: crypto.randomUUID(),
									clientId: "",
									clientName: "",
									task: "",
									time: "",
								},
							],
			});
		} else {
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
	}, [shift, isSuccess]);

	const weekDates = getWeekDates(shiftDate);
	const weekFrom = weekDates[0];
	const weekTo = weekDates[6];

	// TODO: LEARN THIS (fetch week shift)
	const {
		data: fetchedWeekShifts = [],
		isLoading: weekLoading,
		isSuccess: weekSuccess,
		error: fetchWeekShiftError,
	} = useQuery({
		queryKey: ["user-page", userId, "week-shifts", weekFrom, weekTo],

		queryFn: async () => {
			const { data, error } = await supabase
				.from("shifts")
				.select(
					"shift_date, start_time, end_time, pause_time, over_time, work_done",
				)
				.eq("user_id", userId)
				.gte("shift_date", weekFrom)
				.lte("shift_date", weekTo);

			if (error) throw error;

			return data ?? [];
		},

		enabled: isWeek && !!userId,
	});

	useEffect(() => {
		if (!weekSuccess) return;

		const merged = weekDates.map((date) => {
			const existing = fetchedWeekShifts.find(
				(shift) => shift.shift_date === date,
			);

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
						clientId: "",
						clientName: "",
						task: "",
						time: "",
					},
				],
			};
		});

		setWeekShifts(merged);
	}, [weekSuccess, fetchedWeekShifts, weekFrom, weekTo]);

	const monthDates = getMonthDates(shiftDate);
	const from = monthDates[0];
	const to = monthDates[monthDates.length - 1];

	// TODO: LEARN THIS (fetch month shift)
	const {
		data: fetchedMonthShifts,
		isLoading: monthLoading,
		isSuccess: monthSuccess,
		error: fetchMonthShiftError,
	} = useQuery({
		queryKey: ["user-page", userId, "month-shifts", from, to],

		queryFn: async () => {
			const { data, error } = await supabase
				.from("shifts")
				.select(
					"shift_date, start_time, end_time, pause_time, over_time, work_done",
				)
				.eq("user_id", userId)
				.gte("shift_date", from)
				.lte("shift_date", to);

			if (error) throw error;

			return data ?? [];
		},

		enabled: isMonth && !!userId,
	});

	useEffect(() => {
		if (!monthSuccess) return;

		const merged = monthDates.map((date) => {
			const existing = fetchedMonthShifts.find(
				(shift) => shift.shift_date === date,
			);

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
						task: "",
						time: "",
					},
				],
			};
		});

		setMonthShifts(merged);
	}, [monthSuccess, fetchedMonthShifts, from, to]);

	// TODO: LEARN THIS (saveWorkshift)
	const {
		mutateAsync: saveWorkShift,
		isPending: savingWorkShift,
		error: saveDayShiftError,
	} = useMutation({
		mutationKey: ["user-page", userId, "save-shift"],

		mutationFn: async (overrides: Partial<typeof data> = {}) => {
			const updatedData = {
				...data,
				...overrides,
			};

			const hasTime =
				!!updatedData.startTime ||
				!!updatedData.endTime ||
				!!updatedData.pauseTime ||
				!!updatedData.overTime;

			const workDoneToSave = updatedData.workDone.filter(
				(item) =>
					item.task?.trim() ||
					item.time?.trim() ||
					item.clientId?.trim() ||
					item.clientName?.trim(),
			);

			const hasWorkDone = workDoneToSave.length > 0;

			if (!hasTime && !hasWorkDone) {
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
				{
					onConflict: "user_id,shift_date",
				},
			);

			if (error) throw error;
		},

		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["user-page", userId, "shift", shiftDate],
			});
		},
	});

	// TODO: LEARN THIS (saveWeekDayWorkshift)
	const { mutateAsync: saveWeekDayWorkShift, error: saveWeekShiftError } =
		useMutation({
			mutationKey: ["user-page", userId, "save-week-shift"],

			mutationFn: async (day: WeekShift) => {
				const hasTime =
					!!day.startTime || !!day.endTime || !!day.pauseTime || !!day.overTime;

				const workDoneToSave = day.workDone.filter(
					(item) =>
						item.task?.trim() ||
						item.time?.trim() ||
						item.clientId?.trim() ||
						item.clientName?.trim(),
				);

				const hasWorkDone = workDoneToSave.length > 0;

				if (!hasTime && !hasWorkDone) {
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
					{
						onConflict: "user_id,shift_date",
					},
				);

				if (error) throw error;
			},

			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: ["user-page", userId, "week-shifts"],
				});
			},
		});

	const saveWeekDateWorkShift = async (day: WeekShift) => {
		setSavingDate(day.shiftDate);

		try {
			await saveWeekDayWorkShift(day);
		} finally {
			setSavingDate(null);
		}
	};

	// TODO: LEARN THIS (saveMonthDayWorkshift)
	const { mutateAsync: saveMonthDayWorkShift, error: saveMonthShiftError } =
		useMutation({
			mutationKey: ["user-page", userId, "save-month-shift"],

			mutationFn: async (day: WeekShift) => {
				const hasTime =
					!!day.startTime || !!day.endTime || !!day.pauseTime || !!day.overTime;

				const workDoneToSave = day.workDone.filter(
					(item) =>
						item.task?.trim() ||
						item.time?.trim() ||
						item.clientId?.trim() ||
						item.clientName?.trim(),
				);

				const hasWorkDone = workDoneToSave.length > 0;

				if (!hasTime && !hasWorkDone) {
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
					{
						onConflict: "user_id,shift_date",
					},
				);

				if (error) throw error;
			},

			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: ["user-page", userId, "month-shifts"],
				});
			},
		});

	const saveMonthDateWorkShift = async (day: WeekShift) => {
		setSavingMonthDate(day.shiftDate);

		try {
			await saveMonthDayWorkShift(day);
		} finally {
			setSavingMonthDate(null);
		}
	};

	// Handle day input on change
	const handleDataInput = (name: string, value: any) => {
		setData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	// Handle week day input on change
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

	// Handle month day input on change
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

	// Handle day work done on change
	const handleChangeInput = (id: string, name: string, value: string) => {
		setData((prev) => ({
			...prev,
			workDone: prev.workDone.map((item) =>
				item.id === id ? { ...item, [name]: value } : item,
			),
		}));
	};

	// Handle week day work done on change
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

	// Handle month day work done on change
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

	// Add day work done row
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

	// Add week day work done row
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

	// Add month day work done row
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

	useEffect(() => {
		if (!isValidTime(data.startTime) || !isValidTime(data.endTime)) {
			setTotal("00:00");
			setTotalError(null);
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

		setTotal(
			`${hours.toString().padStart(2, "0")}:${minutes
				.toString()
				.padStart(2, "0")}`,
		);

		const totalTimeSpendMinutes = data.workDone.reduce((sum, work) => {
			if (!isValidTime(work.time)) return sum;

			return sum + timeToMinutes(work.time);
		}, 0);

		if (totalMinutes !== totalTimeSpendMinutes) {
			setTotalError(
				new Error("Total time spent should be equal to total working time"),
			);
		} else {
			setTotalError(null);
		}
	}, [data, shiftDate]);

	const error =
		fetchClientsError ||
		fetchDayShiftError ||
		fetchWeekShiftError ||
		fetchMonthShiftError ||
		saveDayShiftError ||
		saveWeekShiftError ||
		saveMonthShiftError ||
		totalError ||
		null;

	useEffect(() => {
		onError(error);
	}, [error, onError]);

	if (!currentUser) return <p>Loading...</p>;

	if (isWeek) {
		return (
			<section className="section">
				<div className="section__heading-container">
					<ClockIcon size={20} />
					<h2>Workshift for the week</h2>
				</div>
				{weekShifts.map((day) => (
					<DayRow
						key={day.shiftDate}
						day={day}
						editable={editable}
						onDataInput={handleWeekDataInput}
						onWorkDoneChange={handleWeekWorkDoneChange}
						onAddWorkDone={addWeekWorkDoneEntry}
						onBlurSave={saveWeekDateWorkShift}
						clients={clients}
						saving={savingDate === day.shiftDate || weekLoading}
					/>
				))}
			</section>
		);
	}

	if (isMonth) {
		return (
			<section className="section">
				<div className="section__heading-container">
					<ClockIcon size={20} />
					<h2>Workshift for the month</h2>
				</div>
				{monthShifts.map((day) => (
					<DayRow
						key={day.shiftDate}
						day={day}
						editable={editable}
						onDataInput={handleMonthDataInput}
						onWorkDoneChange={handleMonthWorkDoneChange}
						onAddWorkDone={addMonthWorkDoneEntry}
						onBlurSave={saveMonthDateWorkShift}
						clients={clients}
						saving={savingMonthDate === day.shiftDate || monthLoading}
					/>
				))}
			</section>
		);
	}

	return (
		<section className="section">
			<div className="section__heading-container">
				<ClockIcon size={20} />
				<h2>Workshift</h2>
			</div>
			<div className="visit-container">
				<div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
					<div className="visit-input-container">
						<label>Start time</label>
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
										saveWorkShift({ startTime: value });
										return;
									}

									const validTime = /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);

									if (!validTime && value !== "") {
										handleDataInput("startTime", "");
										saveWorkShift({ startTime: "" });
										return;
									}

									saveWorkShift({});
								}}
								className={classNames("workshift__input", {
									"workshift__input--disabled": !editable || savingWorkShift,
								})}
								disabled={!editable || savingWorkShift}
							/>

							<button
								type="button"
								className={classNames("workshift__input-clear", {
									"workshift__input-clear--disabled":
										!data.startTime || !editable || savingWorkShift,
								})}
								onClick={() => {
									handleDataInput("startTime", "");
									saveWorkShift({ startTime: "" });
								}}
								aria-label="Clear start time"
								disabled={!data.startTime || !editable || savingWorkShift}
							>
								×
							</button>
						</div>
					</div>
					<div className="visit-input-container">
						<label>End time</label>
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
										saveWorkShift({ endTime: value });
										return;
									}

									const validTime = /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);

									if (!validTime && value !== "") {
										handleDataInput("endTime", "");
										saveWorkShift({ endTime: "" });
										return;
									}

									saveWorkShift({});
								}}
								className={classNames("workshift__input", {
									"workshift__input--disabled": !editable || savingWorkShift,
								})}
								disabled={!editable || savingWorkShift}
							/>

							<button
								type="button"
								className={classNames("workshift__input-clear", {
									"workshift__input-clear--disabled":
										!data.endTime || !editable || savingWorkShift,
								})}
								onClick={() => {
									handleDataInput("endTime", "");
									saveWorkShift({ endTime: "" });
								}}
								aria-label="Clear start time"
								disabled={!data.endTime || !editable || savingWorkShift}
							>
								×
							</button>
						</div>
					</div>
					<div className="visit-input-container">
						<label>Pause time</label>
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
										saveWorkShift({ pauseTime: value });
										return;
									}

									const validTime = /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);

									if (!validTime && value !== "") {
										handleDataInput("pauseTime", "");
										saveWorkShift({ pauseTime: "" });
										return;
									}

									saveWorkShift({});
								}}
								className={classNames("workshift__input", {
									"workshift__input--disabled": !editable || savingWorkShift,
								})}
								disabled={!editable || savingWorkShift}
							/>

							<button
								type="button"
								className={classNames("workshift__input-clear", {
									"workshift__input-clear--disabled":
										!data.pauseTime || !editable || savingWorkShift,
								})}
								onClick={() => {
									handleDataInput("pauseTime", "");
									saveWorkShift({ pauseTime: "" });
								}}
								aria-label="Clear start time"
								disabled={!data.pauseTime || !editable || savingWorkShift}
							>
								×
							</button>
						</div>
					</div>
					<div className="visit-input-container">
						<label>Extra time</label>
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
										saveWorkShift({ overTime: value });
										return;
									}

									const validTime = /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);

									if (!validTime && value !== "") {
										handleDataInput("overTime", "");
										saveWorkShift({ overTime: "" });
										return;
									}

									saveWorkShift({});
								}}
								className={classNames("workshift__input", {
									"workshift__input--disabled": !editable || savingWorkShift,
								})}
								disabled={!editable || savingWorkShift}
							/>
							<button
								type="button"
								className={classNames("workshift__input-clear", {
									"workshift__input-clear--disabled":
										!data.overTime || !editable || savingWorkShift,
								})}
								onClick={() => {
									handleDataInput("overTime", "");
									saveWorkShift({ overTime: "" });
								}}
								aria-label="Clear start time"
								disabled={!data.overTime || !editable || savingWorkShift}
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
						<label>Total</label>
						<p className="workshift__input">{total}</p>
					</div>
				</div>
			</div>
			<div className="workshift__grid-container">
				{data.workDone.map((item) => {
					return (
						<div className="workshift__grid" key={item.id}>
							<div style={{ width: "1%", whiteSpace: "nowrap" }}>
								<label>Client</label>
								<select
									style={{ width: "auto" }}
									className={classNames("workshift__input", {
										"workshift__input--disabled":
											!editable || clientsLoading || savingWorkShift,
									})}
									name="clientId"
									value={item.clientId}
									onChange={(e) =>
										handleChangeInput(item.id, e.target.name, e.target.value)
									}
									onBlur={() => saveWorkShift({})}
									disabled={!editable || clientsLoading || savingWorkShift}
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
								<label>Task</label>
								<AutoGrowTextArea
									value={item.task}
									handleChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
										handleChangeInput(item.id, e.target.name, e.target.value)
									}
									name="task"
									blur={() => saveWorkShift({})}
									disable={!editable || savingWorkShift}
								/>
							</div>
							<div>
								<label>Time Spend</label>
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

											saveWorkShift({
												workDone: updatedWorkDone,
											});
										}}
										className={classNames("workshift__input", {
											"workshift__input--disabled":
												!editable || savingWorkShift,
										})}
										disabled={!editable || savingWorkShift}
									/>
									<button
										type="button"
										className={classNames("workshift__input-clear", {
											"workshift__input-clear--disabled":
												!item.time || !editable || savingWorkShift,
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

											saveWorkShift({
												workDone: updatedWorkDone,
											});
										}}
										disabled={!item.time || !editable || savingWorkShift}
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
				className={classNames("workshift__btn", {
					"workshift__btn--disabled": !editable || savingWorkShift,
				})}
				onClick={addWorkDoneEntry}
				disabled={!editable || savingWorkShift}
			>
				Add separate cient row
			</button>
		</section>
	);
};

export default Visit;
