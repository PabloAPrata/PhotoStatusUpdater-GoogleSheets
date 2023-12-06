const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');
const axios = require('axios');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

let data = [];


async function loadSavedCredentialsIfExist() {
    try {
        const content = await fs.readFile(TOKEN_PATH);
        const credentials = JSON.parse(content);
        return google.auth.fromJSON(credentials);
    } catch (err) {
        return null;
    }
}

async function saveCredentials(client) {
    const content = await fs.readFile(CREDENTIALS_PATH);
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
        type: 'authorized_user',
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: client.credentials.refresh_token,
    });
    await fs.writeFile(TOKEN_PATH, payload);
}

async function authorize() {
    let client = await loadSavedCredentialsIfExist();
    if (client) {
        return client;
    }
    client = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH,
    });
    if (client.credentials) {
        await saveCredentials(client);
    }
    return client;
}


async function pullData(auth) {
    const sheets = google.sheets({ version: 'v4', auth });

    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: '1Fnpm1-0l90Sl6EpjLR9dBYTPXcaVywCEmEaW3nQftck',
        range: 'A2:D70',
    });
    data = res.data.values;

    if (!data || data.length === 0) {
        console.log('Não foram encontrados dados.')
        return;
    }

    console.log(data[0])
}

async function updateField(auth, text) {

    const sheets = google.sheets({ version: 'v4', auth });

    await sheets.spreadsheets.values.update({
        spreadsheetId: '1Fnpm1-0l90Sl6EpjLR9dBYTPXcaVywCEmEaW3nQftck',
        range: 'A70',
        valueInputOption: 'RAW',
        resource: {
            values: [[text]],
        },
    });
}



async function main(auth) {
    const text = "Pablo";

    pullData(auth);
    // updateField(auth, text);
}

authorize().then(main).catch(console.error);