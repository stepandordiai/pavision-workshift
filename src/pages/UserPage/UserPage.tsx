import Weekbar from "../../components/Weekbar/Weekbar";
import { useParams } from "react-router-dom";
import Visit from "../../components/Visit/Visit";
import { supabase } from "../../lib/supabase";
import { useState } from "react";
import StatusIndicator from "../../components/StatusIndicator/StatusIndicator";
import "./UserPage.scss";
import { useIsFetching, useIsMutating, useQuery } from "@tanstack/react-query";

const toLocalDateString = (date: Date) => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
};

const UserPage = () => {
	const today = new Date();

	const [shiftDate, setShiftDate] = useState(toLocalDateString(today));

	const [isWeek, setIsWeek] = useState(false);
	const [isMonth, setIsMonth] = useState(false);
	const [workShiftError, setWorkShiftError] = useState<Error | null>(null);

	const { id } = useParams<string>();

	const fetchingCount = useIsFetching({
		queryKey: ["user-page", id],
	});

	const mutatingCount = useIsMutating({
		mutationKey: ["user-page", id],
	});

	const loading = fetchingCount > 0 || mutatingCount > 0;

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

	const error = authError || memberError || workShiftError;

	return (
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
				userId={id}
				currentUser={authUser}
				shiftDate={shiftDate}
				isWeek={isWeek}
				isMonth={isMonth}
				onError={setWorkShiftError}
			/>

			<StatusIndicator loading={loading} error={error} />
		</>
	);
};

export default UserPage;
