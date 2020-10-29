const csv = require('csv-parser');
const fs = require('fs');
const axios = require('axios');

var datetime = new Date();
const actual = datetime.toISOString().slice(0,10);
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: `output-${actual}.csv`,
  header: [
    {id: 'row_num', title: 'RowNum'},
    {id: 'message', title: 'Message'},
    {id: 'contact_type', title: 'ContactType'},
    {id: 'case_id', title: 'Case'},
    {id: 'message_date', title: 'MessageDate'},
    {id: 'interaction_date', title: 'InteractionDate'},
    {id: 'event_name', title: 'Event'},
    {id: 'reason_id', title: 'Reason'},
    {id: 'site', title: 'Site'},
    {id: 'prediction', title: 'Label Prediction'},
    {id: 'supervised', title: 'Label Supervised'},
    {id: 'comment', title: 'Comment'},
  ]
});

const filename = 'input.csv';
const data = [];
const results = [];
let count = 0;

const urlPredict = 'https://mla-test_aml-cx-med.furyapps.io/predict';
const headers = {
    'Content-Type': 'application/json',
    'X-Auth-Token': 'd4a0b2435e87289df9a5ed5b1d26413f253d1cb5cbc29d5e01194a476ea3275f',
  }

const processCSV = () => {
    console.log(`Fetch predictions and creating output...`);
    fs.createReadStream(filename)
    .pipe(csv())
    .on('data', (row) => {
        count++;
        data.push(row);
    })
    .on('end', () => {
        fetchPredictions();
    });
};

const fetchPredictions = async() => {
    await Promise.all(data.map( async (elem, idx) => {

        const payload = {
            "claimId": 0,
            "message": elem.message,
            "messageId": 0
        };

        try {
            const resp = await axios.post(urlPredict, payload, { headers: headers });
            elem.prediction = resp.data.prediction;
            elem.comment = resp.data.explanation;
            results.push(elem);
         }
        catch(error) {

            try {
                const resp = await axios.post(urlPredict, payload, { headers: headers });
                elem.prediction = resp.data.prediction;
                elem.comment = resp.data.explanation;
                results.push(elem);
             }
            catch(error) {
                elem.comment = `ERROR: ${error}`;
                results.push(elem);
            }
        }

    })).then(() => {
        csvWriter
        .writeRecords(results)
        .then(()=> console.log('The CSV file was written successfully'));
    });
};

processCSV();

