import { CardData } from "./CardData";

export function shuffle(array: CardData[]): void {
    let currentIndex = array.length,
        temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
} 

export async function postData(url:string, data:any = {}, authToken?:string): Promise<{headers:Headers,data:any}> {
    const headers:any = {
        'Content-Type': 'application/json',
    };
    if(authToken) {
        headers['EXAUTH'] = authToken;
    }
    // Default options are marked with *
    const response = await fetch(url, {
            method: 'POST', // *GET, POST, PUT, DELETE, etc.
            mode: 'cors', // no-cors, *cors, same-origin
            cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            credentials: 'same-origin', // include, *same-origin, omit
            headers: headers,
            redirect: 'follow', // manual, *follow, error
            referrer: 'no-referrer', // no-referrer, *client
            body: JSON.stringify(data), // body data type must match "Content-Type" header
        });
    const txt = await response.text();
    const returnData = txt ? JSON.parse(txt) : {};
    return {
        headers: response.headers,
        data: returnData
    };
}

export async function getData(url:string, authToken?:string): Promise<{headers:Headers,data:any}> {
    const headers:any = {
        'Content-Type': 'application/json',
    };
    if(authToken) {
        headers['EXAUTH'] = authToken;
    }
    // Default options are marked with *
    const response = await fetch(url, {
            method: 'GET', // *GET, POST, PUT, DELETE, etc.
            mode: 'cors', // no-cors, *cors, same-origin
            cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            credentials: 'same-origin', // include, *same-origin, omit
            headers: headers,
            redirect: 'follow', // manual, *follow, error
            referrer: 'no-referrer', // no-referrer, *client
        });
    const txt = await response.text();
    const returnData = txt ? JSON.parse(txt) : {};
    return {
        headers: response.headers,
        data: returnData
    };
}

export function createUUID() {
    // http://www.ietf.org/rfc/rfc4122.txt
    let s = [];
    const hexDigits = "0123456789abcdef";
    for (let i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19].charCodeAt(0) & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";

    const uuid = s.join("");
    return uuid;
}