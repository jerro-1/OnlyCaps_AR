import { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../utils/supabase";
import Main from "../components/Main";
import Card from "../components/Card";
import PageWrapper from "../components/PageWrapper";
import ShopButn from "../components/ShopButn";

const MFASetup = () => {
    const [qr, setQr] = useState(null);
    const [factorId, setFactorId] = useState(null);
    const [otp, setOtp] = useState("");
    const navigate = useNavigate();

    const enroll = async () => {
        const { data, error } = await supabase.auth.mfa.enroll({
            factorType: "totp",
        });

        if (error) return alert(error.message);

        setQr(data.totp.qr_code);
        setFactorId(data.id);
    };

    const verify = async () => {
        const { data: challengeData, error: challengeError } =
            await supabase.auth.mfa.challenge({
                factorId,
            });

        if (challengeError) return alert(challengeError.message);

        const { error: verifyError } = await supabase.auth.mfa.verify({
            factorId,
            challengeId: challengeData.id,
            code: otp,
        });

        if (verifyError) return alert(verifyError.message);

        alert("MFA setup complete!");
        navigate("/");
    };

    return (
        <Main className="flex justify-center items-center min-h-screen">
            <Card className="w-full max-w-md p-6 text-center">

                {/* Title */}
                <h2 className="text-2xl font-bold mb-2">Set up Authenticator</h2>
                <p className="text-sm text-gray-500 mb-6">
                    Secure your account with Google Authenticator
                </p>

                {/* Step 1: Enable */}
                {!qr && (
                    <div className="flex flex-col items-center gap-4">
                        <p className="text-gray-600 text-sm">
                            Click below to generate your QR code
                        </p>

                        <button className="btn" onClick={enroll}>
                            Enable MFA
                        </button>
                    </div>
                )}

                {/* Step 2: QR + Verify */}
                {qr && (
                    <div className="flex flex-col items-center gap-5">

                        {/* Instructions */}
                        <p className="text-sm text-gray-600">
                            Scan this QR code using Google Authenticator
                        </p>

                        {/* QR Code */}
                        <div className="bg-white p-4 rounded-lg shadow">
                            <div dangerouslySetInnerHTML={{ __html: qr }} />
                        </div>

                        {/* Input */}
                        <input
                            type="text"
                            placeholder="Enter 6-digit code"
                            className="w-full px-4 py-2 border rounded-lg text-center text-black focus:outline-none focus:ring-2 focus:ring-black"
                            onChange={(e) => setOtp(e.target.value)}
                        />

                        {/* Verify Button */}
                        <button
                            onClick={verify}
                            className="btn btn-primary w-full rounded-lg"
                            style={{
                                backgroundColor: "#000",
                                color: "#fff",
                                border: "none",
                            }}
                        >
                            Verify & Continue
                        </button>

                    </div>
                )}
            </Card>
        </Main>
    );
};

export default MFASetup;