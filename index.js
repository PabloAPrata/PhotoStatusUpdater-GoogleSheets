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
    console.log("Puxando a tabela...");
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

async function getJobStatus(job_ID) {
    // curl -X GET -H "Content-Type: application/json" "http://localhost:8000/jobs/b227783c-79a7-413b-8177-2444d4b0ebfc"
    const url = `http://localhost:8000/jobs/${job_ID}`
    axios.get(url, {
        headers: {
            'Content-Type': 'application/json',
        },
    })

    .then(response => {

    })
    .catch(error => {
        console.error('Erro na requisição:', error.message);
    })
}


async function main(auth) {
    const text = "Pablo";


    let interval = setInterval(()=>{
        pullData(auth).then(() => {
            console.log("Concluído!");
    
            data.forEach(linha => {
       
                const parte = linha[0];
                const status = linha[1];
                const job_ID = linha[3];
    
                console.log(`\tParte: ${parte}\n status: ${status}\n JobID: ${job_ID}`);
    
    
            });

            
        });
    }, 300000)

    

}

authorize().then(main).catch(console.error);