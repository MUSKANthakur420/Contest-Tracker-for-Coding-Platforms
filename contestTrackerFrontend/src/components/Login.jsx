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
        <main className="max-w-md mx-auto px-6 py-14 font-sans text-[#e6e8ef]">
            <div className="bg-[#131720] border border-[#232838] rounded-2xl px-8 py-9">
                <span className="inline-block font-mono text-xs tracking-widest uppercase text-[#4f8cff] mb-2">
                    welcome back
                </span>
                <h1 className="text-2xl font-bold text-[#f2f4f8] mb-6">Log in to ContTrack</h1>

                {error && (
                    <p className="text-sm text-[#ff5c5c] mb-4">{error}</p>
                )}

                <form onSubmit={handler} className="flex flex-col gap-4">
                    <input
                        type='email'
                        placeholder='Enter your email'
                        required
                        onChange={(e) => setemail(e.target.value)}
                        value={email}
                        className="bg-[#0b0e14] border border-[#232838] rounded-lg px-3.5 py-2.5 text-sm text-[#e6e8ef] placeholder:text-[#545b70] outline-none focus:border-[#4f8cff] transition-colors"
                    />
                    <input
                        type='password'
                        placeholder='Enter your password'
                        required
                        onChange={(e) => setpassword(e.target.value)}
                        value={password}
                        className="bg-[#0b0e14] border border-[#232838] rounded-lg px-3.5 py-2.5 text-sm text-[#e6e8ef] placeholder:text-[#545b70] outline-none focus:border-[#4f8cff] transition-colors"
                    />
                    <button
                        type='submit'
                        disabled={loading}
                        className="mt-2 text-sm font-semibold text-[#0b0e14] bg-[#4f8cff] px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Logging in..." : "Submit"}
                    </button>
                </form>
            </div>
        </main>
    )
}

export default Login