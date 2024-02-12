import React, {useEffect, useState} from "react";
import {createRoot, Root} from "react-dom/client";

const Popup = () => {
    const [isBlur, setIsBlur] = useState(false);

    useEffect((): void => {
        chrome.storage.local.get(['isBlur'], function (result) {
            setIsBlur(result.isBlur);
        });
    }, []);

    const handleClick = (): void => {
        const newIsBlur: boolean = !isBlur;
        setIsBlur(newIsBlur);
        chrome.storage.local.set({isBlur: newIsBlur}, function (): void {
            console.log('Value is set to ' + newIsBlur);
        });
    };

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "250px",
        }}>
            <h1 style={{filter: isBlur ? "blur(5px)" : "none"}}>
                {isBlur ? "Blurred" : "Unblurred"} Text
            </h1>
            <p>※ ページをリロードする必要があります。</p>
            <button
                onClick={handleClick}
                style={{marginRight: "5px"}}
            >
                {isBlur ? "Unblur" : "Blur"}
            </button>
        </div>
    );
};

const root: Root = createRoot(document.getElementById("root")!);

root.render(
    <React.StrictMode>
        <Popup/>
    </React.StrictMode>
);