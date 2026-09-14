import { useState } from "react";
import Visit from "../../components/Visit/Visit";
// import Weekbar from "../../components/Weekbar/Weekbar";
import { supabase } from "../../lib/supabase";
import { useIsFetching, useIsMutating, useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import StatusIndicator from "../../components/StatusIndicator/StatusIndicator";
import classNames from "classnames";
import "./styles.scss";

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

export default function Workshifts() {
	const today = new Date();

	const [shiftDate, setShiftDate] = useState(toLocalDateString(today));
	const [isWeek, setIsWeek] = useState(false);
	const [isMonth, setIsMonth] = useState(false);
	const [workShiftError, setWorkShiftError] = useState<Error | null>(null);

	const { id } = useParams<string>();

	const { data: viewedUser = null, error: memberError } = useQuery({
		queryKey: ["user-page", id, "member"],

		queryFn: async () => {
			const { data, error } = await supabase
				.from("members")
				.select("id, full_name")
				.eq("id", id)
				.maybeSingle();

			if (error) throw error;

			return data;
		},

		enabled: !!id,
	});

	const { data: authUser = null, error: authError } = useQuery({
		queryKey: ["user-page", id, "auth-user"],

		queryFn: async () => {
			const {
				data: { user },
				error,
			} = await supabase.auth.getUser();

			if (error) throw error;

			return user ? { id: user.id } : null;
		},
	});

	const fetchingCount = useIsFetching({
		queryKey: ["user-page", id],
	});

	const mutatingCount = useIsMutating({
		mutationKey: ["user-page", id],
	});

	const loading = fetchingCount > 0 || mutatingCount > 0;

	const error = workShiftError || authError;

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
		<>
			<section className="section">
				<h1>Workshift ({viewedUser?.full_name})</h1>
			</section>
			<div className="">
				<div className="weekbar-container">
					{!isWeek && !isMonth && (
						<div className="weekbar-input-container">
							<span className="weekbar-input-lable">Date</span>
							<input
								className="weekbar__input"
								value={shiftDate}
								onChange={(e) => setShiftDate(e.target.value)}
								type="date"
							/>
						</div>
					)}

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

			<Visit
				userId={id}
				currentUser={authUser}
				shiftDate={shiftDate}
				isWeek={isWeek}
				isMonth={isMonth}
				onError={setWorkShiftError}
			/>

			<StatusIndicator loading={loading} error={error || memberError} />
		</>
	);
}
