import {
    getConfigValue,
    validHostedFieldTypes,
    validCardSetupTypes,
    supportedStyleKeys,
    specialStyleKeys
} from './ui-config'
import {setAppData,getAppData} from './utils';
const citrusSelectorPrefix = 'citrus';
const uiSetup = (setUpConfig) => {
    "use strict";
    let {
        hostedFields,
        cardType,
        style
    } = setUpConfig;
    if (validCardSetupTypes.indexOf(cardType) === -1)
        throw new Error(`invalid cardType "${cardType}", cardType should have one of these values ` + validCardSetupTypes);
    for (var i = 0, length = hostedFields.length; i < length; ++i) {
        let {
            fieldType,
            identifier
        } = hostedFields[i];
        if (validHostedFieldTypes.indexOf(fieldType) !== -1) {
            appendIframe(hostedFields[i], cardType.toLowerCase(), style);
        } else {
            throw new Error(`invalid fieldType "${fieldType}", fieldType should have one of these values ` + validHostedFieldTypes);
        }
    }
    //setStyle(style,hostedFields,cardType);
};


const appendIframe = (hostedField, cardType, style) => {
    "use strict";
    let {identifier,fieldType} = hostedField;
    const invalidIdentifierMessage = `invalid identifier for field type "${fieldType}", it should be of the form of #id or .cssClass`;
    const iframe = document.createElement('iframe');
    var defaultStyle = {
        width: '100%',
        float: 'left',
        height: '100%',
        /*'marginBottom': '1em',
        'display': 'block',
        backgroundColor: 'transparent',*/
        border: 'none',
        /*outline: '0',
        fontSize: '16px',
        padding: 0,
        boxShadow: 'none',
        borderRadius: 0,
        position: 'relative'*/
    };
    //frameborder="0" allowtransparency="true" scrolling="no"
    iframe.setAttribute('frameborder', 0);
    iframe.setAttribute('allowtransparency', true);
    iframe.setAttribute('scrolling', 'no');
    //iframe.setAttribute('tabindex', '-1');
    Object.assign(iframe.style, defaultStyle);
    //todo: url needs to be configured
    iframe.src = getConfigValue('hostedFieldUrl') + '#' + fieldType + '-' + cardType;
    iframe.id = getCitrusFrameId(fieldType, cardType);
    iframe.onload = () => {
        console.log('inside iframe onload');
        passAttributesToHostedField(style, hostedField, cardType); 
    };
    iframe.onfocus = ()=>{
        console.log('inside iframe onfocus');
        var inputElements = document.getElementsByTagName('input');
        if(inputElements&&inputElements.length>0)
        inputElements[0].focus();
    };
    if (!identifier || identifier.length <= 1)
        throw new Error(invalidIdentifierMessage);
    const identifierName = identifier.slice(1);
    if (identifier.indexOf('#') === 0)
        document.getElementById(identifierName).appendChild(iframe);
    else if (identifier.indexOf('.') == 0)
        document.getElementsByClassName(identifierName)[0].appendChild(iframe);
    else throw new Error(invalidIdentifierMessage);
}
//todo:rename to setStyle and other attributes
const passAttributesToHostedField = (attributes, hostedField, cardType) => {
   
    let hostedFrameAttributes = {
        messageType: 'style'
    };
    let {identifier,fieldType} = hostedField;
    if(attributes)
    {
    if (attributes[identifier]) {
        hostedFrameAttributes.specificStyle = attributes[identifier];
    }
    if (attributes['input']) {
        hostedFrameAttributes.commonStyle = attributes['input'];
    }
    for(var i=0;i<specialStyleKeys.length;++i)
    {
        var specialStyleKey = specialStyleKeys[i];
        hostedFrameAttributes['input'+specialStyleKey] = attributes[specialStyleKey]||attributes['input'+specialStyleKey];
        hostedFrameAttributes[identifier+specialStyleKey] = attributes[specialStyleKey]||attributes[identifier+specialStyleKey];
    }
    }
    hostedFrameAttributes.hostedField = hostedField;
    hostedFrameAttributes.cardType = cardType;
    //Object.assign(hostedFrameAttributes,attributes);
    postMessageToChild(fieldType, cardType, hostedFrameAttributes, true);

}

const applyAttributes = (attributes) => {
    if (!attributes)
        return;
    let applicableStyle = {};

    function createSytleObject(styleParam) {
        if (!styleParam)
            return;
        let keys = Object.keys(styleParam);
        for (var i = 0; i < keys.length; ++i) {
            let key = keys[i];
            if (supportedStyleKeys.indexOf(key) !== -1) {
                applicableStyle[convertHyphenFormatToCamelCase(key)] = styleParam[key];
            }else if(specialStyleKeys.indexOf(key)!==-1)
            {
                //todo:handle :focus,.valid,.invalid here

            } else {
                console.warn(`${key} is not supported`);
            }
        }
    }
    setAppData('hostedField',attributes.hostedField);
    setAppData('cardType',attributes.cardType);
    createSytleObject(attributes.commonStyle);
    createSytleObject(attributes.specificStyle);
    var inputElement = document.getElementsByTagName('input')[0];
    if(attributes.hostedField&&attributes.hostedField.placeHolder)
    {
        inputElement.setAttribute('placeholder',attributes.hostedField.placeHolder);
    }
    Object.assign(inputElement.style, applicableStyle);
    var cssText = '';
      for(var i=0;i<specialStyleKeys.length;++i)
    {
        var specialStyleKey = specialStyleKeys[i];
        if(attributes['input'+specialStyleKey]){
            cssText += convertStyleToCssString('input'+specialStyleKey,attributes['input'+specialStyleKey]);
        }
        addStyleTag(cssText);
        //if(attributes[])
    }
    /*if(attributes.style){
        var selectors = Object.keys(attributes.style);
        var cssText = '';
        for(var i=0;i<selectors.length;++i){
            var selector = selectors[i];

            if(attributes.style[selector])
            {
               cssText += convertStyleToCssString(selector,attributes.style[selector]);
            }
        }
        addStyleTag(cssText);
    }*/

}

const isValidSelector=(selector,hostedField)=>{


}
const convertCustomSytleObjectToCssString = (style,selector)=>{

}

const convertStyleToCssString = (selector,style)=>{
    if(!style)
    return;
    console.log(style);
    var keys = Object.keys(style);
    var cssText = selector +' {';
    var specialStyles = [];
    for (var i = 0; i < keys.length; ++i) {
            let key = keys[i];
            if (supportedStyleKeys.indexOf(key) !== -1) {
                cssText += key+':'+style[key]+';'
                //applicableStyle[convertHyphenFormatToCamelCase(key)] = styleParam[key];
            } else {
                console.warn(`${key} is not supported`);
            }
        }
        cssText += '}';
     return cssText;   
}

function addCSSRule(selector, rules,sheet, index) {
    if(!sheet&&document.styleSheets.length>0)
        sheet = document.styleSheets[document.styleSheets.length - 1];
    else
        addStyleTag()
	if("insertRule" in sheet) {
		sheet.insertRule(selector + "{" + rules + "}", index);
	}
	else if("addRule" in sheet) {
		sheet.addRule(selector, rules, index);
	}
}
const addStyleTag = (css)=>{
    //var css = 'h1 { background: red; }',
    var head = document.head || document.getElementsByTagName('head')[0],
    style = document.createElement('style');

style.type = 'text/css';
if (style.styleSheet){
  style.styleSheet.cssText = css;
} else {
  style.appendChild(document.createTextNode(css));
}

head.appendChild(style);


}

/*function styleHyphenFormat(propertyName) {
  function upperToHyphenLower(match) {
    return '-' + match.toLowerCase();
  }
  return propertyName.replace(/[A-Z]/g, upperToHyphenLower);
}*/
function convertHyphenFormatToCamelCase(propertyName) {
    function hyphenLowerToUpper(match) {
        return match[1].toUpperCase();
    }
    return propertyName.replace(/-[a-z]/g, hyphenLowerToUpper);
}

const postMessageToChild = (fieldType, cardType, message, isSetTimeoutRequired) => {
    let frameId = getCitrusFrameId(fieldType, cardType);
    if (isSetTimeoutRequired) {
        setTimeout(() => {
            postMessage(frameId, message);
        }, 0);
    } else {
        postMessage(frameId, message);
    }
}

const postMessage = (frameId, message) => {
    let childFrameDomain = getConfigValue('hostedFieldDomain');
    let win = document.getElementById(frameId).contentWindow;
    win.postMessage(message, childFrameDomain);
}

const getCitrusFrameId = (fieldType, cardType) => {
    return citrusSelectorPrefix + fieldType + '-' + cardType;
}

export {
    uiSetup,
    applyAttributes
};