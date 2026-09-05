import { useState } from "react";
import { useNavigate, NavLink, Link } from "react-router-dom";
import Header from "../components/Header";
import supabase from "../utils/supabase";
import Input from "../components/Input";
import Card from "../components/Card";
import Main from "../components/Main";
import PageWrapper from "../components/PageWrapper";
import BgImg from "../components/BgImg";
import { FaArrowLeft } from "react-icons/fa";

const RegisterEmail = () => {
    const [formData, setFormData] = useState({
        firstname: "",
        lastname: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const navigate = useNavigate();

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSendOtp = async () => {
        const { firstname, lastname, email, password, confirmPassword } = formData;

        if (!firstname || !lastname || !email || !password) {
            alert("Please fill in all fields");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        if (cooldown > 0) return;

        try {
            setLoading(true);

            const { error } = await supabase.auth.signInWithOtp({
                email: email
            });

            if (error) throw error;

            alert("OTP sent! Check your email.");

            // start cooldown (30 seconds)
            setCooldown(30);
            const timer = setInterval(() => {
                setCooldown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            navigate("/verify", { state: { firstname, lastname, email, password } });

        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageWrapper>
            <BgImg>
                <Header />
                <Main className="flex justify-center items-center min-h-screen px-4">
                    <Card>
                        <div className="flex justify-center mb-6">
                            <NavLink to="/">
                                <img
                                    src="/images/LOGO.png"
                                    alt="ONLYCaps"
                                    className="h-9"
                                    onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                                />
                                <span className="font-heading text-xl tracking-wider hidden text-[#14110D]">ONLYCAPS</span>
                            </NavLink>
                        </div>

                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 text-xs font-body text-[#6B6558] hover:text-[#14110D] transition-colors mb-4"
                        >
                            <FaArrowLeft size={11} /> Back to sign in
                        </Link>

                        <h1 className="font-heading text-2xl uppercase tracking-wide text-[#14110D] mb-1 text-center">
                            Create your account
                        </h1>
                        <p className="font-body text-sm text-[#6B6558] text-center mb-8">
                            Join OnlyCaps and start shopping
                        </p>

                        <Input
                            label="First name"
                            name="firstname"
                            type="text"
                            placeholder="Enter your first name"
                            onChange={handleInputChange}
                        />

                        <Input
                            label="Last name"
                            name="lastname"
                            type="text"
                            placeholder="Enter your last name"
                            onChange={handleInputChange}
                        />

                        <Input
                            label="Email"
                            name="email"
                            type="email"
                            placeholder="you@email.com"
                            onChange={handleInputChange}
                        />

                        <Input
                            label="Password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            onChange={handleInputChange}
                        />

                        <Input
                            label="Confirm password"
                            name="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            onChange={handleInputChange}
                        />

                        <button
                            className="w-full bg-[#14110D] text-[#FAF8F4] font-body text-sm font-medium py-3 rounded-full mt-2 hover:bg-[#2A241C] transition-colors disabled:opacity-50"
                            onClick={handleSendOtp}
                            disabled={loading || cooldown > 0}
                        >
                            {loading
                                ? "Sending..."
                                : cooldown > 0
                                    ? `Resend in ${cooldown}s`
                                    : "Send OTP Code"}
                        </button>
                    </Card>
                </Main>
            </BgImg>
        </PageWrapper>
    );
};

export default RegisterEmail;
