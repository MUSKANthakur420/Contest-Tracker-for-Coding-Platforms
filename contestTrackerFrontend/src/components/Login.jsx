import React, { useEffect } from 'react'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../features/auth/authSlice';

function Login() {
    const [email, setemail] = useState("");
    const [password, setpassword] = useState("");
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, error, loading } = useSelector((state) => state.auth);

    const handler = (e) => {
        e.preventDefault();
        dispatch(loginUser({ email, password }));
    }

    // Redirect to home the moment login succeeds (user gets set in the store)
    useEffect(() => {
        if (user) {
            navigate("/");
        }
    }, [user, navigate]);

    return (
        <main className="max-w-md mx-auto px-6 py-16 font-sans text-[#e6e8ef]">
            <div className="bg-[#10141c] border border-[#232838] rounded-2xl px-8 py-9 shadow-xl backdrop-blur-sm transition-all">
                <span className="inline-block font-mono text-xs tracking-widest uppercase text-[#4f8cff] mb-2 font-semibold">
                    welcome back
                </span>
                <h1 className="text-2xl font-bold text-[#f2f4f8] mb-6 tracking-tight">Log in to ContTrack</h1>

                {error && (
                    <div className="p-3 mb-4 rounded-lg bg-[#ff5c5c]/10 border border-[#ff5c5c]/20 text-xs text-[#ff5c5c] font-medium animate-fadeIn">
                        {error}
                    </div>
                )}

                <form onSubmit={handler} className="flex flex-col gap-4">
                    <div>
                        <label htmlFor="login-email" className="block text-xs text-[#8a90a6] mb-1.5 font-medium">Email Address</label>
                        <input
                            id="login-email"
                            type="email"
                            placeholder="Enter your email"
                            required
                            onChange={(e) => setemail(e.target.value)}
                            value={email}
                            className="w-full bg-[#0b0e14] border border-[#232838] rounded-lg px-3.5 py-2.5 text-sm text-[#e6e8ef] placeholder:text-[#545b70] outline-none focus:border-[#4f8cff] focus:ring-1 focus:ring-[#4f8cff] transition-all"
                        />
                    </div>

                    <div>
                        <label htmlFor="login-password" className="block text-xs text-[#8a90a6] mb-1.5 font-medium">Password</label>
                        <input
                            id="login-password"
                            type="password"
                            placeholder="Enter your password"
                            required
                            onChange={(e) => setpassword(e.target.value)}
                            value={password}
                            className="w-full bg-[#0b0e14] border border-[#232838] rounded-lg px-3.5 py-2.5 text-sm text-[#e6e8ef] placeholder:text-[#545b70] outline-none focus:border-[#4f8cff] focus:ring-1 focus:ring-[#4f8cff] transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-3 w-full text-sm font-semibold text-[#0b0e14] bg-[#4f8cff] px-5 py-3 rounded-lg hover:bg-[#3f7ceb] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#4f8cff]/10"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-[#0b0e14]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Signing in...</span>
                            </>
                        ) : (
                            "Log In"
                        )}
                    </button>
                </form>
            </div>
        </main>
    )
}

export default Login