"use client";

import React from "react";

interface ShareButtonsProps {
    title: string;
}

const ShareButtons: React.FC<ShareButtonsProps> = ({ title }) => {
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";

    return (
        <div className="flex gap-4">
            <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/20 text-blue-500 font-orbitron text-sm rounded-none transition-all"
            >
                Facebook
            </a>
            <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2 bg-sky-400/10 hover:bg-sky-400/20 border border-sky-400/20 text-sky-400 font-orbitron text-sm rounded-none transition-all"
            >
                Twitter
            </a>
        </div>
    );
};

export default ShareButtons;
