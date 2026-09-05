import React from 'react'
import { useState, useEffect, useContext } from 'react';
import { SessionContext } from "../context/SessionContext";
import supabase from '../utils/supabase'; // FIX: was missing, would throw ReferenceError

const Initials = () => {
    const [profileInitials, setProfileInitials] = useState("");
    const session = useContext(SessionContext);

    useEffect(() => {
        if (!session) return;

        const fetchProfile = async () => {
            const { data, error } = await supabase
                .from("profiles")
                .select("firstname, lastname")
                .eq("id", session.user.id)
                .single();

            if (error) {
                console.log("Error fetching profile:", error.message);
            } else if (data) {
                const initials =
                    (data.firstname?.[0] ?? "") + (data.lastname?.[0] ?? "");
                setProfileInitials(initials.toUpperCase());
            }
        };

        fetchProfile();
    }, [session]);

    return (
        <>
            {profileInitials || "AC"}
        </>
    )
}

export default Initials