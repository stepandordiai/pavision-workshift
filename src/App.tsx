import Sidebar from "./components/layout/Sidebar/Sidebar";
import Home from "./pages/Home/Home";
import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from "react-router-dom";
import { supabase } from "./lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import Header from "./components/layout/Header/Header";
import Login from "./pages/Login/Login";
import ResetPassword from "./pages/ResetPassword/ResetPassword";
import "./styles/App.scss";
import UserPage from "./pages/UserPage/UserPage";
import Clients from "./pages/Clients/Clients";

function App() {
	const [session, setSession] = useState<Session | null>(null);
	const [authLoading, setAuthLoading] = useState(true);

	// TODO: LEARN THIS
	useEffect(() => {
		supabase.auth.getSession().then(({ data }) => {
			setSession(data.session);
			setAuthLoading(false);
		});

		const { data: listener } = supabase.auth.onAuthStateChange(
			(_event, session) => {
				setSession(session);
			},
		);

		return () => listener.subscription.unsubscribe();
	}, []);

	// TODO: learn this
	if (authLoading) return null;

	return (
		<Router>
			<Routes>
				<Route path="/reset-password" element={<ResetPassword />} />
				<Route
					path="/login"
					element={!session ? <Login /> : <Navigate to="/" replace />}
				/>
				<Route
					path="/*"
					element={
						!session ? (
							<Navigate to="/login" replace />
						) : (
							<div className="layout">
								<Sidebar />
								<div style={{ width: "100%" }}>
									<Header />
									<main className="main">
										<Routes>
											<Route path="/" element={<Home />} />
											<Route path="/users/:id" element={<UserPage />} />
											<Route path="/clients" element={<Clients />} />
										</Routes>

										{/* <Footer /> */}
									</main>
								</div>
							</div>
						)
					}
				/>
			</Routes>
		</Router>
	);
}

export default App;
