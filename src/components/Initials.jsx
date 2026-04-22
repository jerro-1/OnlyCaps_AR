import React from 'react'
import { useState, useEffect, useContext } from 'react';
import { SessionContext } from "../context/SessionContext";


const Initials = () => {
    const [profileInitials, setProfileInitials] = useState("");
    const session = useContext(SessionContext);

    useEffect(() => {
        if (!session) return;

        const fetchProfile = async () => {
            const { data, error } = await supabase
                .from("profiles") // your table
                .select("firstname, lastname") // match your column names exactly
                .eq("id", session.user.id) // make sure this is the same column as in your table
                .single();

            if (error) {
                console.log("Error fetching profile:", error.message);
            } else if (data) {
                // get first letters of firstname and lastname
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