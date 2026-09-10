import Weekbar from "../../components/Weekbar/Weekbar";
import { useParams } from "react-router-dom";
import Visit from "../../components/Visit/Visit";
import { supabase } from "../../lib/supabase";
import { useEffect, useState } from "react";
import "./UserPage.scss";

const UserPage = () => {
	const { id } = useParams<string>();
	const today = new Date();
	const [error, setError] = useState<string | null>(null);
	const [authUser, setAuthUser] = useState<{ id: string } | null>(null);
	const [viewedUser, setViewedUser] = useState<{
		id: string;
		full_name: string;
	} | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			setAuthUser(user ? { id: user.id } : null);

			const { data: members, error } = await supabase
				.from("members")
				.select("id, full_name");

			if (error) setError(error.message);
			setViewedUser(members?.find((m) => m.id === id) ?? null);
		};

		fetchData();
	}, [id]);

	console.log(error);

	// TODO: learn this
	const toLocalDateString = (date: Date) => {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
	};

	const [shiftDate, setShiftDate] = useState(toLocalDateString(today));
	const [isWeek, setIsWeek] = useState<boolean>(false);
	const [isMonth, setIsMonth] = useState<boolean>(false);
	// const [periodActive, setPeriodActive] = useState<boolean>(false);

	return (
		<>
			{/* <div
				style={{
					display: "flex",
					justifyContent: "flex-start",
					alignItems: "center",
					gap: 5,
				}}
			>
				<button
					style={{ justifyContent: "flex-end", width: "max-content" }}
					className={classNames("switch-btn", {
						"switch-btn--active": periodActive,
					})}
					onClick={() => setPeriodActive((prev) => !prev)}
				></button>
				<span style={{ fontWeight: 600 }}>Export</span>
			</div> */}
			<>
				<section className="section">
					<h1 style={{ fontSize: "2rem" }}>{viewedUser?.full_name}</h1>
				</section>
				<Weekbar
					shiftDate={shiftDate}
					setShiftDate={setShiftDate}
					isWeek={isWeek}
					setIsWeek={setIsWeek}
					isMonth={isMonth}
					setIsMonth={setIsMonth}
				/>
				<Visit
					// key={user?._id}
					userId={id}
					currentUser={authUser}
					shiftDate={shiftDate}
					// setShiftDate={setShiftDate}
					isWeek={isWeek}
					isMonth={isMonth}
				/>

				{/* <Responsibilities
						shiftDate={shiftDate}
						userId={id}
						currentUser={user}
						isWeek={isWeek}
					/> */}
				{/* <Plan userId={id} currentUser={user} /> */}
			</>
			{/* <Footer /> */}
		</>
	);
};

export default UserPage;
