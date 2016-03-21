//import 'babel-polyfill';

import 'core-js/fn/object/assign';
import 'core-js/fn/promise';
import 'core-js/fn/string/includes';

import {makeNetBankingPayment} from './apis/net-banking';
import {getPaymentDetails, getPaymentDetailsForMCP} from './apis/payment-details';
import  {makeBlazeCardPayment, getmerchantCardSchemes, makeMotoCardPayment} from './apis/cards';
import {validateExpiryDate, validateScheme, validateCreditCard} from './validation/custom-validations';
import {init, handlersMap, setConfig, getConfig} from './config';
import {makeMCPCardPayment, getCardCurrencyInfo} from './apis/mcp';
import * as tests from './tests/simple-tests';
import {schemeFromNumber} from './utils';

init(); //initializes custom validators

window.citrus = window.citrus || {};

Object.assign(window.citrus, {
    setConfig,
    getConfig,
    validators: {
        validateExpiryDate,
        validateScheme,
        validateCreditCard
    },
    utils: {
        schemeFromNumber
    },
    registerHandlers: (key, handler) => {
        handlersMap[key] = handler;
    },
    geteways: {
        getPaymentDetails
    },
    netbanking: {
        makeNetBankingPayment
    },
    cards: {
        getmerchantCardSchemes,
        makeBlazeCardPayment,
        makeMCPCardPayment,
        getCardCurrencyInfo,
        getPaymentDetailsForMCP,
        getPaymentDetails
    }
});
//some dummy comment dfdfs
//tests.test1();