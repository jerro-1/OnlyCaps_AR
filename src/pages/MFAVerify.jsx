import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import Card from "../components/Card";
import Main from "../components/Main";
import PageWrapper from "../components/PageWrapper";
import supabase from "../utils/supabase";
import ShopButn from "../components/ShopButn";

const MFAVerify = () => {
    const { state } = useLocation();
    const navigate = useNavigate();

    const [otp, setOtp] = useState("");

    const handleVerify = async () => {
        try {
            const { data: challengeData, error: challengeError } =
                await supabase.auth.mfa.challenge({
                    factorId: state.factorId,
                });

            if (challengeError) throw challengeError;

            const { error: verifyError } = await supabase.auth.mfa.verify({
                factorId: state.factorId,
                challengeId: challengeData.id,
                code: otp,
            });

            if (verifyError) throw verifyError;

            navigate("/"); // 

        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <>
            <Main className="flex justify-center items-center min-h-screen">
                <Card className="w-full max-w-md p-6 text-center flex flex-col items-center">
                    <h2 className="text-2xl font-semibold">Enter Authenticator Code</h2>
                    <input className="w-full max-w-md mt-10 p-7 border border-gray-300 rounded-lg text-center text-black"
                        placeholder="Enter the 6-digit code"
                        onChange={(e) => setOtp(e.target.value)}
                    />
                    <div className="w-full max-w-mdtext-center flex flex-col items-center">
                        <ShopButn onClick={handleVerify}>Verify</ShopButn>
                    </div>
                </Card>
            </Main >
        </>
    );
};

export default MFAVerify;