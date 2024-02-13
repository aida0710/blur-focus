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
            <div style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
            }}>
                <button
                    onClick={handleClick}
                    style={{marginRight: "5px"}}
                >
                    {isBlur ? "Blurを無くす" : "Blurを掛ける"}
                </button>
                <button
                    style={{marginRight: "5px"}}
                    onClick={(): void => {
                        chrome.tabs.reload().then();
                    }}>Pageをリロード
                </button>
            </div>
            <p style={{
                borderBottom: "1px solid #000",
                width: "100%",
                paddingTop: "5px",
                margin: "5px",
            }}>Settings</p>
            <p>※ 未実装機能です。</p>
        </div>
    );
};

const root: Root = createRoot(document.getElementById("root")!);

root.render(
    <React.StrictMode>
        <Popup/>
    </React.StrictMode>
);