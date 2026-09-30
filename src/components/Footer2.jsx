import React from 'react'
import { CiInstagram } from "react-icons/ci";
import { FaFacebook } from "react-icons/fa";


const Footer2 = () => {
    return (
        <>
            <footer className="footer sm:footer-horizontal bg-neutral text-neutral-content p-10">
                <aside>
                    <img src="/images/LOGO.png" alt="OnlyCaps" className="h-12 w-auto" />
                    <p>
                        OnlyCaps
                        <br />
                        Fitted caps &amp; snapbacks, with AR try-on.
                    </p>
                </aside>
                <nav>
                    <h6 className="footer-title">Social</h6>
                    <div className="grid grid-flow-col gap-4">
                        <a
                            href="https://www.instagram.com/__onlycaps/"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="OnlyCaps on Instagram"
                        >
                            <CiInstagram className="h-7 w-7" />
                        </a>
                        <a
                            href="https://www.facebook.com/profile.php?id=61578056421668"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="OnlyCaps on Facebook"
                        >
                            <FaFacebook className="h-7 w-7" />
                        </a>
                    </div>
                </nav>
            </footer>
        </>
    )
}

export default Footer2