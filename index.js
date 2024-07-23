require('dotenv').config()
const express = require('express')
const app = express()
const port = process.env.PORT || 3000
const cors = require('cors')
const helmet = require("helmet")
const bodyParser = require('body-parser');
const path = require('path')
app.use(cors({
    origin:"*"
}))
app.use(helmet({
    contentSecurityPolicy: false,
    xDownloadOptions: false
}))

app.use((error, req, res, next)=>{
   if(error){
    res.status(500).json({
        msg: "Internal Server Error",
        error: error
    })
   }
})
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.set('view engine', 'ejs');
app.use(express.static('public'))
app.use(express.static(__dirname + 'public'))
app.use(express.static(__dirname + 'views'))
app.use(express.static(path.join(__dirname, '/public')))
app.use(express.static(path.join(__dirname, '/views')))

const routes = require('./routes/index')
app.use(routes)
const axios = require('axios');
const xml2js = require('xml2js');

app.get('/jamef',(req, res)=>{
    try {
       

        const cnpj = '25098466000100';
        const password = 'elements@2509';
        const idConhecimentos = 'elementss';

        const soapEnvelope = `
            <?xml version="1.0" encoding="utf-8"?>
            <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
            <soap:Body>
                <trackingByDoc xmlns="http://expressojundiai.com.br/NewSitexWebService/Tracking">
                <cnpj>${cnpj}</cnpj>
                <password>${password}</password>
                <idConhecimentos>${idConhecimentos}</idConhecimentos>
                </trackingByDoc>
            </soap:Body>
            </soap:Envelope>`;

        const config = {
            method: 'post',
            url: 'http://newsitex.expressojundiai.com.br/NewSitexWebService/Tracking.asmx',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': 'http://expressojundiai.com.br/NewSitexWebService/Tracking/trackingByDoc'
            },
            data: soapEnvelope 
        };

        axios(config)
            .then(response => {
                console.log('Response status:', response.status);
                console.log('Response data:', response.data);

                // Optional: Parse the XML response to JSON
                xml2js.parseString(response.data, (err, result) => {
                    if (err) {
                        console.error('Error parsing XML:', err);
                    } else {
                        console.log('Parsed JSON:', JSON.stringify(result, null, 2));
                    }
                });
            })
            .catch(error => {
                console.error('Error:', error);
            });

    } catch (error) {
        
    }
})

app.listen(port,(error)=>{
 console.log(`Server running on port ${port}`)
})