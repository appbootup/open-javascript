import {validateAndCallbackify, getMerchantAccessKey, schemeFromNumber} from './../utils';
import {baseSchema} from './../validation/validation-schema';
import cloneDeep from 'lodash/cloneDeep';
import {getConfig} from '../config';
import {validateCardType, validateScheme} from '../validation/custom-validations';
//import $ from 'jquery';
import {custFetch} from '../interceptor';
import {urlReEx} from '../constants';


const regExMap = {
    'cardNumber': /^[0-9]{15,19}$/,
    'name': /^(?!\s*$)[a-zA-Z .]{1,50}$/,
    'CVV': /^[0-9]{3,4}$/, //todo: handle cases for amex
    url: urlReEx
};


const blazeCardValidationSchema = {

    mainObjectCheck: {
        /* keysCheck: ['cardNo', 'expiry', 'cvv', 'cardHolderName',
         'email', 'phone', 'amount', 'currency', 'returnUrl', 'notifyUrl', 'merchantTransactionId', 'merchantAccessKey',
         'signature', 'cardType','cardScheme'],*/
        blazeCardCheck: true
    },
    expiry: {presence: true, cardDate: true},
    cvv: {presence: true, format: regExMap.CVV},
    //cardHolderName : { presence: true, format: regExMap.name },
    email: {presence: true, email: true},
    phone: {length: {maximum: 10}},
    amount: {presence: true},
    currency: {presence: true},
    returnUrl: {
        presence: true,
        custFormat: {
            pattern: regExMap.url,
            message: 'should be proper URL string'
        }
    },
    notifyUrl: {
        custFormat: {
            pattern: regExMap.url,
            message: 'should be proper URL string'
        }
    },
    merchantAccessKey: {presence: true},
    signature: {presence: true}
};


const makeBlazeCardPayment = validateAndCallbackify(blazeCardValidationSchema, (confObj) => {
    //needed to convert cardType and cardScheme with server expected values
    const paymentDetails = Object.assign({}, confObj, {
        cardType: validateCardType(confObj.cardType),
        cardScheme: validateScheme(confObj.cardScheme)
    });

    console.log('Config for blazecard fetch !!!', paymentDetails);


    return custFetch(getConfig().blazeCardApiUrl + '/cards-gateway/rest/cardspg/mpi', {
        method: 'post',
        headers: {
            'Content-Type': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify(paymentDetails)
    });

});

//----------------------------------------------------------------------------------------------------

const merchantCardSchemesSchema = {
    merchantAccessKey: {presence: true}
};

/*
 confObj = {
 "merchantAccessKey" : "27AOYSJCQOR6VZ39V7JV"
 };
 */

const getmerchantCardSchemes = validateAndCallbackify(merchantCardSchemesSchema, (confObj) => {

    return custFetch(getConfig().blazeCardApiUrl + '/cards-gateway/rest/cardspg/merchantCardSchemes/getEnabledCardScheme', {
        method: 'post',
        headers: {
            'Content-Type': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify(confObj)
    });
});



//----------------------------------------------------------------------------------------------------



//moto implementation

const motoCardValidationSchema = Object.assign(cloneDeep(baseSchema), {
    paymentDetails: {
        presence: true,
        cardCheck: true,
        keysCheck: ['type', 'number', 'holder', 'cvv', 'expiry']
    },
    //"paymentDetails.type" : { presence: true },
    //"paymentDetails.scheme": { presence: true},
    //"paymentDetails.number": {presence: true },
    "paymentDetails.holder": {presence: true, format: regExMap.name},
    "paymentDetails.cvv": {presence: true, format: regExMap.CVV},
    "paymentDetails.expiry": {presence: true, cardDate: true}

});

motoCardValidationSchema.mainObjectCheck.keysCheck.push('paymentDetails');

const  motoCardApiFunc = (confObj) => {

    const paymentDetails = Object.assign({}, confObj.paymentDetails, {
        type: validateCardType(confObj.paymentDetails.type),
        scheme: validateScheme(schemeFromNumber(confObj.paymentDetails.number))
    });

    const reqConf = Object.assign({}, confObj, {
        amount: {
            currency: confObj.currency || 'INR',
            value: confObj.amount
        },
        paymentToken: {
            type: 'paymentOptionToken',
            paymentMode: paymentDetails
        },
        merchantAccessKey: getMerchantAccessKey(confObj),
        requestOrigin: "CJSG"
    });

    delete reqConf.paymentDetails;
    delete reqConf.currency;

    console.log('Config for fetch!!', reqConf);


    return custFetch(`${getConfig().motoApiUrl}/moto/authorize/struct/${getConfig().vanityUrl}`, {
        method: 'post',
        headers: {
            'Content-Type': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify(reqConf)
    })

};

const makeMotoCardPayment = validateAndCallbackify(motoCardValidationSchema, motoCardApiFunc);

/*

{
    "merchantTxnId": "nosdfjlkeuwjffasdf2418",
    "amount": {
    "currency": "INR",
        "value": "1.00"
},
    "userDetails": {
    "email": "nikhil.yeole1@gmail.com",
        "firstName": "nikhil",
        "lastName": "yeole",
        "address": {
        "street1": "abcstree1",
            "street2": "abcstree2",
            "city": "Pune",
            "state": "MS",
            "country": "IND",
            "zip": "411038"
    },
    "mobileNo": "99349494944"
},
    "returnUrl": "http://localhost:3000/returnUrl",
    "paymentToken": {
    "type": "paymentOptionToken",
        "paymentMode": {
        "type": "credit",
            "scheme": "VISA",
            "number": "4111111111111111",
            "holder": "nikhil",
            "expiry": "12/2016",
            "cvv": "223"
    }
},
    "notifyUrl": "<%= notifyUrl %>",
    "merchantAccessKey": "66PT1PDZ38A5OB1PTF01",
    "requestSignature": "45b693d8eeed6f5d135f6d6a13333da50055f5bb",
    "requestOrigin": "CJSG"
}

*/

export {makeBlazeCardPayment, getmerchantCardSchemes, motoCardValidationSchema, motoCardApiFunc,
    makeMotoCardPayment};
