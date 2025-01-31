// ==UserScript==
// @name         ATF Booru Improved
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  make ATF Booru more comfy to use
// @author       Aleph0
// @match        https://booru.allthefallen.moe/*
// @icon         https://booru.allthefallen.moe/favicon.svg
// @grant        window.onurlchange
// @homepage
// ==/UserScript==

(function() {
    'use strict';

    //TODO:
    //     Download button
    //     prob make everything on urlchange
    //     msg for fav/unfav

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
        console.error("CSRF-Token nicht gefunden!");
        return;
    }

    // username
    let username = document.body.getAttribute("data-current-user-name");

    // custom text
    let h1 = document.createElement("h1");
    h1.textContent = "Better ATF Booru test";
    h1.style.position = "fixed";
    h1.style.top = "5px";
    h1.style.left = "5px";
    h1.style.backgroundColor = "white";
    h1.style.padding = "5px";
    h1.style.zIndex = "1000";

    // functions
    function sendPostRequest(postId, isFavorite) {
        let apiBaseUrl = "https://booru.allthefallen.moe/favorites";
        let fullUrl = isFavorite
        ? `${apiBaseUrl}/${encodeURIComponent(postId)}`
        : `${apiBaseUrl}?post_id=${encodeURIComponent(postId)}`;

        let bodyPost = isFavorite
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
            .then(data => console.log("Erfolgreich gesendet:", data))
            .catch(error => console.error("Fehler beim Senden:", error));
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

            // Button erstellen
            let button = document.createElement("button");
            button.textContent = "♡";
            button.className = "custom-button";
            button.style.marginTop = "10px";
            button.style.padding = "5px 10px";
            button.style.backgroundColor = "#007bff";
            button.style.color = "white";
            button.style.border = "none";
            button.style.cursor = "pointer";

            container.appendChild(button);

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
                        button.textContent = "♥";
                    } else {
                        console.log("not fav: ", lastDiv,"  ", postId);
                    }
                } else {
                    console.log("not exist");
                }
            })
                .catch(error => console.error("Fehler beim Laden der Seite:", error));

            // Klick-Event hinzufügen (z.B. für späteres Favorisieren)
            button.addEventListener("click", function() {
                if(button.textContent == "♡")
                {
                    sendPostRequest(postId, false);
                    button.textContent = "♥";
                }
                else
                {
                    sendPostRequest(postId, true);
                    button.textContent = "♡";
                }
            });
        });
    }

    document.body.appendChild(h1);

    setInterval(addButtonToPosts, 2000);
})();