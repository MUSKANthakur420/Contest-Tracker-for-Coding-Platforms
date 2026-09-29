import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';

const INPUT =
    "w-full bg-[#0b0e14] border border-[#232838] rounded-lg px-3.5 py-2.5 text-sm text-[#e6e8ef] placeholder:text-[#545b70] outline-none focus:border-[#4f8cff] focus-visible:ring-2 focus-visible:ring-[#4f8cff]/30 transition-colors";
const LABEL = "block text-xs text-[#8a90a6] mb-1.5";

// key must match the field name the backend expects
const HANDLES = [
    { key: 'leetcode', label: 'LeetCode' },
    { key: 'codeforces', label: 'Codeforces' },
    { key: 'codechef', label: 'CodeChef' },
    { key: 'atcoder', label: 'AtCoder' },
    { key: 'gfg', label: 'GeeksforGeeks' },
    { key: 'hackerrank', label: 'HackerRank' },
    { key: 'naukri', label: 'Code360 (naukri.com)' },
];

function Field({ id, label, children }) {
    return (
        <div>
            <label htmlFor={id} className={LABEL}>{label}</label>
            {children}
        </div>
    );
}

function Register() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [handles, setHandles] = useState(
        Object.fromEntries(HANDLES.map((h) => [h.key, ""]))
    );
    const [img, setImg] = useState(null);
    const [preview, setPreview] = useState("");

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { error, loading } = useSelector((state) => state.auth);

    // Live preview of the chosen profile image; revoke the URL on change/unmount
    useEffect(() => {
        if (!img) {
            setPreview("");
            return;
        }
        const url = URL.createObjectURL(img);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [img]);

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await dispatch(
                registerUser({
                    username: username.trim(),
                    email: email.trim(),
                    password,
                    ...Object.fromEntries(
                        Object.entries(handles).map(([k, v]) => [k, v.trim()])
                    ),
                    img,
                })
            ).unwrap();

            navigate("/DashBoard");
        } catch (err) {
            console.error("Registration failed:", err.message);
        }
    };

    return (
        <main className="max-w-xl mx-auto px-6 py-14 font-sans text-[#e6e8ef]">
            <div className="bg-[#131720] border border-[#232838] rounded-2xl px-6 sm:px-8 py-9">
                <h1 className="text-2xl font-bold text-[#f2f4f8] mb-1">Create your account</h1>
                <p className="text-sm text-[#8a90a6] mb-7">
                    Add your details, then link the platforms you use. You can skip any handle.
                </p>

                {error && (
                    <p role="alert" className="text-sm text-[#ff5c5c] bg-[#ff5c5c]/10 border border-[#ff5c5c]/30 rounded-lg px-3.5 py-2.5 mb-5">
                        {error}
                    </p>
                )}

                <form onSubmit={handleRegister} className="flex flex-col gap-6">
                    {/* Profile image, first thing in the form */}
                    <div className="flex items-center gap-4">
                        <label
                            htmlFor="profile-img"
                            className="relative w-20 h-20 shrink-0 rounded-full overflow-hidden border border-dashed border-[#3a4156] bg-[#0b0e14] flex items-center justify-center cursor-pointer hover:border-[#4f8cff] focus-within:ring-2 focus-within:ring-[#4f8cff]/40 transition-colors"
                        >
                            {preview ? (
                                <img src={preview} alt="Profile preview" className="w-full h-full object-cover" />
                            ) : (
                                <Camera size={22} className="text-[#545b70]" aria-hidden="true" />
                            )}
                            <input
                                id="profile-img"
                                type="file"
                                accept="image/*"
                                onChange={(e) => setImg(e.target.files[0] || null)}
                                className="sr-only"
                            />
                        </label>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-[#e6e8ef]">Profile image</p>
                            <p className="text-xs text-[#8a90a6] mb-1.5">Optional. JPG or PNG.</p>
                            {img ? (
                                <button
                                    type="button"
                                    onClick={() => setImg(null)}
                                    className="text-xs text-[#4f8cff] hover:underline"
                                >
                                    Remove image
                                </button>
                            ) : (
                                <label htmlFor="profile-img" className="text-xs text-[#4f8cff] hover:underline cursor-pointer">
                                    Choose image
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Account details */}
                    <div className="flex flex-col gap-4">
                        <Field id="username" label="Name">
                            <input
                                id="username"
                                type="text"
                                required
                                autoComplete="name"
                                placeholder="Your name"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className={INPUT}
                            />
                        </Field>
                        <Field id="email" label="Email">
                            <input
                                id="email"
                                type="email"
                                required
                                autoComplete="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={INPUT}
                            />
                        </Field>
                        <Field id="password" label="Password">
                            <input
                                id="password"
                                type="password"
                                required
                                minLength={6}
                                autoComplete="new-password"
                                placeholder="At least 6 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={INPUT}
                            />
                        </Field>
                    </div>

                    {/* Platform handles */}
                    <div>
                        <h2 className="text-sm font-semibold text-[#f2f4f8] mb-1">Platform usernames</h2>
                        <p className="text-xs text-[#8a90a6] mb-4">Only your username, not the full profile link.</p>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {HANDLES.map(({ key, label }) => (
                                <Field key={key} id={key} label={label}>
                                    <input
                                        id={key}
                                        type="text"
                                        autoComplete="off"
                                        autoCapitalize="none"
                                        spellCheck={false}
                                        placeholder="username"
                                        value={handles[key]}
                                        onChange={(e) =>
                                            setHandles((prev) => ({ ...prev, [key]: e.target.value }))
                                        }
                                        className={INPUT}
                                    />
                                </Field>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="text-sm font-semibold text-[#0b0e14] bg-[#4f8cff] px-5 py-3 rounded-lg transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8fb4ff]"
                    >
                        {loading ? "Creating account…" : "Create account"}
                    </button>
                </form>
            </div>
        </main>
    );
}

export default Register;