import { supabase } from "../../lib/supabase";
import { useState } from "react";
import "./styles.scss";

const Login = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [authError, setAuthError] = useState("");
	const [authLoading, setAuthLoading] = useState(false);
	const [success, setSuccess] = useState("");
	const [forgotPassword, setForgotPassword] = useState(false);
	const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
	const [name, setName] = useState("");

	// TODO: LEARN THIS
	const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setAuthError("");
		setAuthLoading(true);
		setSuccess("");

		try {
			if (forgotPassword) {
				if (!email) {
					setAuthError("Enter correct email");
					return;
				}

				const { error } = await supabase.auth.resetPasswordForEmail(email, {
					redirectTo: `${window.location.origin}/reset-password`,
				});

				if (error) throw error;
				setSuccess("Password reset email sent - please check your inbox.");
				setForgotPassword(false);
				return;
			}

			if (authMode === "signup" && name.trim().split(/\s+/).length !== 2) {
				setAuthError("Enter correct full name (example: John Doe)");
				return;
			}
			const { error } =
				authMode === "signin"
					? await supabase.auth.signInWithPassword({ email, password })
					: await supabase.auth.signUp({
							email,
							password,
							options: { data: { full_name: name } },
						});

			if (error) throw error;
		} catch (error: any) {
			setAuthError(error.message);
		} finally {
			setAuthLoading(false);
			setTimeout(() => setSuccess(""), 3000);
		}
	};

	return (
		<main className="login-main">
			<div className="login__logo">
				<img src="/logo.svg" width={100} alt="" />
				<h1 style={{ fontSize: "2rem" }}>Workshift</h1>
			</div>
			{authError && <strong style={{ color: "red" }}>{authError}</strong>}
			<form className="login-form" onSubmit={handleAuth}>
				<p className="login__form-heading">
					{authMode === "signup" ? "Sign up" : "Sign in"}
				</p>
				{success && <p style={{ color: "#0f0" }}>{success}</p>}
				{authMode === "signup" && (
					<div className="login-input-container">
						<label className="auth-label" htmlFor="auth-name">
							Full name
						</label>
						<input
							id="auth-name"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							autoComplete="name"
							required
						/>
					</div>
				)}
				<div className="login-input-container">
					<label htmlFor="auth-email">Email</label>
					<input
						id="auth-email"
						onChange={(e) => setEmail(e.target.value)}
						value={email}
						type="email"
						required
					/>
				</div>
				{!forgotPassword && (
					<div className="login-input-container">
						<label htmlFor="auth-password">Password</label>
						<input
							id="auth-password"
							onChange={(e) => setPassword(e.target.value)}
							value={password}
							type="password"
							required
						/>
					</div>
				)}

				<button className="login-submit-btn" type="submit">
					{/* TODO: learn this */}
					{forgotPassword
						? authLoading
							? "Recovering..."
							: "Recover password"
						: authLoading
							? "Wait..."
							: "Login"}
				</button>
				<div>
					{authMode === "signin" && (
						<button
							className="underline-effect"
							onClick={() => setForgotPassword((prev) => !prev)}
						>
							{forgotPassword ? "Login" : "Forgot password?"}
						</button>
					)}
					{!forgotPassword && (
						<div style={{ alignSelf: "flex-end" }}>
							{authMode === "signin" ? (
								<span>
									No account?{" "}
									<button
										type="button"
										className="underline-effect"
										onClick={() => {
											setAuthMode("signup");
											setAuthError("");
										}}
									>
										Sign up
									</button>
								</span>
							) : (
								<span>
									Have an account?{" "}
									<button
										type="button"
										className="underline-effect"
										onClick={() => {
											setAuthMode("signin");
											setAuthError("");
										}}
									>
										Sign in
									</button>
								</span>
							)}
						</div>
					)}
				</div>
			</form>
			<p className="login__author">
				Created by{" "}
				<a
					className="underline-effect"
					href="https://www.heeeyooo.com"
					target="_blank"
					rel="noopener noreferrer"
				>
					<span>heeeyooo studio</span>
				</a>
			</p>
		</main>
	);
};

export default Login;
