// ==UserScript==
// @name         ATF Booru Improved
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  make ATF Booru more comfy to use
// @author       Aleph0
// @match        https://booru.allthefallen.moe/*
// @icon         https://booru.allthefallen.moe/favicon.svg
// @grant        window.onurlchange
// @grant        GM_addStyle
// @homepage
// ==/UserScript==

(function() {
    'use strict';

    //TODO:
    //     prob make everything on urlchange

    // Vars
    // cookies
    let userCookie = document.cookie;

    // csfrToken
    let csrfToken = document.querySelector('meta[name="csrf-token"]') ?
        document.querySelector('meta[name="csrf-token"]').getAttribute('content') :
    null;

    if (!csrfToken) {
        csrfToken = getCookie('csrf_token');
    }

    if (!csrfToken) {
        console.error("CSRF-Token not found!");
        return;
    }

    // username
    let username = document.body.getAttribute("data-current-user-name");

    // custom text
    let h1 = document.createElement("h1");
    h1.textContent = "ATF Booru Improved 1.0";
    h1.style.position = "fixed";
    h1.style.top = "5px";
    h1.style.right = "5px";
    h1.style.backgroundColor = "white";
    h1.style.padding = "5px";
    h1.style.zIndex = "1000";

    // css
    GM_addStyle(`
        .toast {
            position: fixed;
            top: 10px;
            left: 10px;
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            opacity: 0;
            transition: opacity 0.5s ease-in-out;
            z-index: 9999;
        }
    `);

    // functions
     function showToast(message, addedToFav) {
        let toast = document.createElement("div");
        toast.className = "toast";
        toast.textContent = message;

         if (addedToFav) {
             toast.style.backgroundColor = "rgba(40, 167, 69, 0.8)";
         } else {
             toast.style.backgroundColor = "rgba(255, 77, 77, 0.8)";
         }

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = "1";
        }, 100);

        setTimeout(() => {
            toast.style.opacity = "0";
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 500);
        }, 3000);
    }

    function sendPostRequest(postId, isFavourite) {
        let apiBaseUrl = "https://booru.allthefallen.moe/favorites";
        let fullUrl = isFavourite
        ? `${apiBaseUrl}/${encodeURIComponent(postId)}`
        : `${apiBaseUrl}?post_id=${encodeURIComponent(postId)}`;

        let bodyPost = isFavourite
        ? new URLSearchParams({
            "_method": "delete",
            "authenticity_token": csrfToken,
            "button": ""
        }).toString()
        : null;

        fetch(fullUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Cookie": userCookie,
                "X-CSRF-Token": csrfToken
            },
            credentials: "include",
            "body":bodyPost
        })
            .then(response => response.json())
            .then(data => console.log("Sent successfully:", data))
            .catch(error => console.error("Error sending:", error));
    }

    function downloadPost(postId){
        fetch(`https://booru.allthefallen.moe/posts/${postId}`)
        .then(response => response.text())
        .then(html =>{
            let parser = new DOMParser();
            let doc = parser.parseFromString(html, "text/html");
            let link = doc.querySelector("body > div#page > div#c-posts > div#a-show > div > aside#sidebar > section#post-options > ul > li#post-option-download > a");
            if(link){
                let downloadLink = document.createElement("a");
                downloadLink.href = link.href;
                downloadLink.setAttribute("download", "");
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
            }
            else{
                console.log("link not found");
            }
        })
        .catch(error => console.error("Error downloading the image: ", error));
    }

    function getCookie(name) {
        let match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        if (match) return match[2];
        return null;
    }

    function addButtonToPosts() {
        document.querySelectorAll(".post-preview-container").forEach(container => {
            if (container.querySelector(".custom-button")) return;

            let postLink = container.querySelector(".post-preview-link");
            if (!postLink) return;

            let postId = postLink.getAttribute("href").split("/posts/")[1]?.split("?")[0];
            if (!postId) return;

            container.style.position = "relative";

            // buttonwrapper
            let buttonWrapper = document.createElement("div");
            buttonWrapper.style.position = "absolute";
            buttonWrapper.style.right = "0px";
            buttonWrapper.style.bottom = "10px";
            buttonWrapper.style.display = "flex";
            buttonWrapper.style.flexDirection = "column";
            buttonWrapper.style.alignItems = "center";

            // create Buttons
            let favButton = document.createElement("button");
            favButton.textContent = "♡";
            favButton.className = "custom-button";
            favButton.style.marginTop = "5px";
            favButton.style.padding = "5px 10px";
            favButton.style.backgroundColor = "#ff4d4d"; //#007bff
            favButton.style.color = "white";
            favButton.style.border = "none";
            favButton.style.cursor = "pointer";

            let downloadButton = document.createElement("button");
            downloadButton.textContent = "↓";
            downloadButton.className = "custom-button";
            downloadButton.style.marginBottom = "5px";
            downloadButton.style.padding = "5px 10px";
            downloadButton.style.backgroundColor = "#007bff"; //#28a745
            downloadButton.style.color = "white";
            downloadButton.style.border = "none";
            downloadButton.style.cursor = "pointer";

            buttonWrapper.appendChild(downloadButton);
            buttonWrapper.appendChild(favButton);

            container.appendChild(buttonWrapper);

            fetch(`https://booru.allthefallen.moe/posts/${postId}`)
                .then(response => response.text())
                .then(html => {
                let parser = new DOMParser();
                let doc = parser.parseFromString(html, "text/html");
                let lastDiv = doc.querySelector("body > div > div > div > div > section > div.fav-buttons-container > div");

                if (lastDiv) {
                    if (lastDiv.classList.contains("mb-2") &&
                        lastDiv.classList.contains("fav-buttons") &&
                        !lastDiv.classList.contains("fav-buttons-false")) {
                        console.log("fav");
                        favButton.textContent = "♥";
                        favButton.style.backgroundColor = "#28a745";
                    } else {
                        console.log("not fav: ", lastDiv," ", postId);
                    }
                } else {
                    console.log("not exist");
                }
            })
                .catch(error => console.error("Error loading page:", error));

            favButton.addEventListener("click", function() {
                if(favButton.textContent == "♡")
                {
                    sendPostRequest(postId, false);
                    favButton.textContent = "♥";
                    favButton.style.backgroundColor = "#28a745";
                    showToast("Post added to favourites", true);
                }
                else
                {
                    sendPostRequest(postId, true);
                    favButton.textContent = "♡";
                    favButton.style.backgroundColor = "#ff4d4d";
                    showToast("Post removed from favourites", false);
                }
            });

            downloadButton.addEventListener("click", function() {
                downloadPost(postId);
            });
        });
    }

    document.body.appendChild(h1);

    setInterval(addButtonToPosts, 2000);
})();
