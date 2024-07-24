const axios = require('axios');
const vandemmia_token = require('./vandemmiaToken')

async function invoices(data, token) {
    const { page, limit, orderId, status, type, dateStart, dateEnd } = data;
    try {
        const response = await axios.get(`https://www.bling.com.br/Api/v3/nfe?pagina=${page}&limite=${limit}${orderId ? `&numeroLoja=${orderId}` : ''}&situacao=${status}&tipo=${type}&dataEmissaoInicial=${dateStart}&dataEmissaoFinal=${dateEnd}`, {
            headers: {
                "Authorization": `Bearer ${token.token}`
            }
        });
        var notas = response.data.data
        return notas;
    } catch (error) {
        return error;
    }
}

async function invoice(id, token) {
    try {
        const response = await axios.get(`https://bling.com.br/Api/v3/nfe/${id}`, {
            headers: {
                "Authorization": `Bearer ${token.token}`
            }
        });
        return response.data;
    } catch (error) {
        return error;
    }
}

function setDate(getYear, month, dayOfMonth) {
     
    return `${Number(getYear)}-${month}-${dayOfMonth}`;
}

function setDateStart(getYear, month, dayOfMonth) {
    return encodeURIComponent(`${setDate(getYear, month, dayOfMonth)} 00:00:00`);
}

function setDateEnd(getYear, month, dayOfMonth) {
    return encodeURIComponent(`${setDate(getYear, month, dayOfMonth)} 23:59:59`);
}



async function getTokenBling() {
    try {
        const response = await axios.post('https://bling-refresh-token.vercel.app/token');
        return response.data;
    } catch (error) {
        console.log(error);
        return null;
    }
}

async function movvi(id) {
  
    try {
        const response = await axios.post('https://usointerno.movvi.com.br/api/api-conhecimentos-embarcados-movvi/nota', {
            "TOKEN": process.env.MOVVITOKEN,
            "CNPJ_EMBARCADOR": "25098466000100",
            "NOTA_FISCAL": id,
            "SERIE": "1"
        }, {
            headers: { accept: 'application/json', 'content-type': 'application/json' }
        });
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}

async function notaVandemmia(token, data) {
    try {
        const response = await axios.get(`https://api.vendemmia.com.br/pickingepacking/list?startsAt=${data.dateStart}&endsAt=${data.dateEnd}&status[]=IMPORTADO&status[]=SEPARACAO&status[]=CONFERENCIA&status[]=ENVIADO_PARA_FATURAMENTO&status[]=FATURADO&status[]=COLETA_INICIADA&status[]=OUTROS&status[]=CANCELADO&status[]=GERADA_COM_CORTE&type_storage=picking&page=${data.page}&&page_size=${data.limit}`, {
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json',
                'Authorization': `bearer ${token.token}`,
            }
        });
        return response.data.data;
    } catch (error) {
        return 'null';
    }
}
// dataList.transport = await movvi(dataList.operator.noteNumber);
async function shippingCompany(dataList){
    var shippingCompanyName = dataList.operator?.nomeTransportadora
    switch (dataList.operator && dataList.operator?.nomeTransportadora) {
        case 'MOVVI LOGISTICA LTDA':
          
            dataList.shipping_company = await movvi(dataList.operator.noteNumber);
        break;
        case 'EXPRESSO SAO MIGUEL S/A':
            dataList.shipping_company = shippingCompanyName;
            break;
        case 'POSTALES SERVICOS POSTAIS LTDA': // correios
            dataList.shipping_company = shippingCompanyName;
            break;
        case 'MERCADO LIVRE':
            dataList.shipping_company = shippingCompanyName;
            break;

        case 'DBA-AMAZON':
            dataList.shipping_company = shippingCompanyName;
            break;

        case 'JAMEF TRANSPORTES EIRELI':
            dataList.shipping_company = shippingCompanyName;
            break;

        case 'COMSIL EXPRESS TRANSP EIRELI':
            dataList.shipping_company = shippingCompanyName;
            break;
        case 'FL BRASIL HOLDING, LOGISTICA E TRANSPORTE LTDA': // solistica
            dataList.shipping_company = shippingCompanyName;
            break;
        case 'VALDELIR FREDERICO CARDOSO':
            dataList.shipping_company = shippingCompanyName;
            break;
    default:
        break;
  }
}

module.exports = {
    async dataList(req, res) {
        try {
            const tokenBling = await getTokenBling();
            const tokenVandemmia = await vandemmia_token()
            if (!tokenBling) {
                return res.status(500).json({ error: 'Failed to obtain token' });
            }

            const data = {
                page: 1,
                limit: 100,
                orderId: undefined,
                status: 6,
                type: 1,
                dateStart: setDateStart('2024', '07', '01'),
                dateEnd: setDateEnd("2024", "07", "24")
            };

            const invoiceBling = await invoices(data, tokenBling);
            if (invoiceBling.error) {
                return res.status(500).json({ error: 'Failed to fetch invoices' });
            }
   
            const vandemmia_data = await notaVandemmia(tokenVandemmia, data);
            const listInvoicePromises = invoiceBling.map(async (invoice) => {
                var numero = invoice.numero.slice(1)
                const dataList = {
                    invoice,
                    operator: vandemmia_data.find(e => e.noteNumber == numero) ?? 'null',
                    shipping_company: 'null'
                };
                await shippingCompany(dataList)
                return dataList;
            });
            const listInvoice = await Promise.all(listInvoicePromises);
            res.status(200).json(listInvoice);
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

//time curl --get http://localhost:3000/api
// real    0m3.481s
// user    0m0.000s
// sys     0m0.000s