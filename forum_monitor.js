// ==UserScript==
// @name        WOWS Forums Monitor
// @namespace   padtrack.github.io
// @match       https://forum.worldofwarships.*/topic/*
// @grant       none
// @version     1.1
// @author      Trackpad, 0a
// @description Enjoy.
// @license     MIT
// ==/UserScript==

(async () => {
    const APP_ID = "3a123bcefb68a7f79818d51512a29d6a";
    const FIELDS = [
        "account_id",
        "hidden_profile",
        "statistics.pvp.wins",
        "statistics.pvp.battles",
    ];

    const extension = window.location.hostname.split(".").slice(-1)[0];

    const COLORS = {
        hidden: "#7D7D7D",
        bottom: "#FE0E00",
        bars: {
            0.47: "#FE7903",
            0.49: "#FFC71F",
            0.52: "#44B300",
            0.54: "#318000",
            0.56: "#02C9B3",
            0.6: "#D042F3",
            0.65: "#A00DC5",
        },
    };

    function getColor(winrate) {
        let color = COLORS["bottom"];
        for (const bar in COLORS["bars"]) {
            if (winrate < bar) {
                break;
            }
            color = COLORS["bars"][bar];
        }
        return color;
    }

    const comments = document.querySelectorAll('article[id^="elComment"]');
    const detailElements = Array.from(comments)
        .map((e) => e.querySelector(".ipsComment_author"))
        .map((e) => e?.querySelector(".cAuthorPane_info"))
        .filter((e) => !!e);

    const ids = [];
    for (const details of detailElements) {
        const authorProfile = details.querySelector(".cAuthorPane_photo");
        const link = authorProfile.firstElementChild.href;

        const id = link.match(/\/profile\/(\d+)/)[1];
        details.dataset.id = id;
        ids.push(id);
    }

    const requestURL = new URL(
        `https://api.worldofwarships.${extension}/wows/account/info/`
    );
    requestURL.search = new URLSearchParams({
        application_id: APP_ID,
        fields: FIELDS,
        account_id: ids,
    });

    const resp = await fetch(new Request(requestURL.toString()));
    const finished = await resp.json();
    for (const details of detailElements) {
        const id = parseInt(details.dataset.id);
        if (!id) {
            continue;
        }

        const player = finished["data"][id];
        if (!player) {
            continue;
        }

        let text = "Hidden Profile";
        let color = COLORS.hidden;

        if (!player["hidden_profile"]) {
            const pvp = player?.statistics?.pvp;
            if (!pvp) {
                text = "No Random Battles";
            } else {
                const winrate = pvp.wins / pvp.battles;
                text = (winrate * 100).toFixed(2) + "%";
                color = getColor(winrate);
            }
        }

        const el = document.createElement("span");
        el.className = "ipsType_bold";
        el.style = `color: ${color}`;
        el.textContent = text;

        let elements = details.querySelectorAll(":scope > li")
        const target = elements[elements.length - 1];
        details.insertBefore(el, target);
    }
})();
