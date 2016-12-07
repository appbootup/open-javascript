import {handlersMap} from "../config";
import {setAppData,doValidation} from "./../utils";
import {makeNetBankingPayment, makeSavedNBPayment} from "./net-banking";
import {makeHostedFieldPayment, makeSavedCardHostedFieldPayment} from "./hosted-field-payment";
import cloneDeep from "lodash/cloneDeep";
import {baseSchema} from "./../validation/validation-schema";



const makePayment = (paymentObj) => {
    //console.log(paymentObj,'inside make payment');
    if(!paymentObj.paymentDetails)
        throw new Error('Missing paymentDetails object');
    if(!paymentObj.paymentDetails.paymentMode)
        throw new Error('Missing paymentMode property inside paymentDetails object');
    switch (paymentObj.paymentDetails.paymentMode) {
        //todo : needs to be checked for PCI compliant merchants
        case "card" :
            makeHostedFieldPayment(paymentObj);
            break;
        case "netBanking" :
            setAppData('paymentObj', paymentObj);
            makeNetBankingPayment(paymentObj);
            break;
        case "savedCard":
            makeSavedCardHostedFieldPayment(paymentObj);
            break;
        case "savedNetbanking":
            makeSavedNBPayment(paymentObj);
            break;
        //todo: message needs to be structured
        default :
            handlersMap['errorHandler']("Invalid payment mode");
            return;
    }
};

export {
    makePayment
};