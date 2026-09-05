import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
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
                <Main className="flex justify-center">
                    <div className="flex items-center">
                        <Card>

                            {/* Logo */}
                            <div className="flex justify-center mb-6">
                                <NavLink to="/">
                                    <img
                                        src="/images/LOGO.png"
                                        alt="ONLYCaps"
                                        className="logo-img-large"
                                    />
                                </NavLink>
                            </div>

                            {/* Title */}
                            <h1 className="flex items-center text-xl font-bold mb-4">
                                <NavLink to="/login">
                                    <FaArrowLeft className="mr-2" />
                                </NavLink>
                                Create your account
                            </h1>

                            <Input
                                label="Firstname"
                                name="firstname"
                                type="text"
                                placeholder="Enter your first name"
                                className="w-full text-black"
                                onChange={handleInputChange}
                            />

                            <Input
                                label="Lastname"
                                name="lastname"
                                type="text"
                                placeholder="Enter your last name"
                                className="w-full text-black"
                                onChange={handleInputChange}
                            />

                            <Input
                                label="Email"
                                name="email"
                                type="email"
                                placeholder="Enter your email"
                                className="w-full text-black"
                                onChange={handleInputChange}
                            />

                            <Input
                                label="Password"
                                name="password"
                                type="password"
                                placeholder="Enter your password"
                                className="w-full text-black"
                                onChange={handleInputChange}
                            />

                            <Input
                                label="Confirm Password"
                                name="confirmPassword"
                                type="password"
                                placeholder="Confirm your password"
                                className="w-full text-black"
                                onChange={handleInputChange}
                            />

                            {/* Button */}
                            <button
                                className="btn btn-primary rounded-full mt-4 w-full"
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
                    </div>
                </Main>
            </BgImg>
        </PageWrapper>
    );
};

export default RegisterEmail;
