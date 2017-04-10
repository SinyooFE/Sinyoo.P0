// Angular 2
import { enableDebugTools, disableDebugTools } from '@angular/platform-browser';
import { ApplicationRef, enableProdMode } from '@angular/core';
import _ from 'lodash';

// Environment Providers
let PROVIDERS: any[] = [
  // common env directives
];

// oidc & _baseUrl
let _baseUrl = "";
let _authSettings = {
  authority: '',
  client_id: '',
  redirect_uri: '',
  //redirect_uri: '',
  post_logout_redirect_uri: '',
  response_type: '',
  scope: '',
  silent_redirect_uri: '',
  automaticSilentRenew: true,
  //silentRequestTimeout:0,
  filterProtocolClaims: true,
  loadUserInfo: true
};

/**设置API相关信息 */
let setBaseUrl: Function = (srcApiHostUrl: string, srcHostUrl: string, srcAuthUrl: string): void => {
  _baseUrl = `${srcApiHostUrl}/api`;
  _authSettings = {
    authority: `${srcAuthUrl}/auth/identity`,
    client_id: 'p0-ng2-js',
    redirect_uri: `${srcHostUrl}/authorize`,
    //redirect_uri: `${srcHostUrl}/popup.html`,
    post_logout_redirect_uri: srcHostUrl,
    response_type: 'id_token token',
    scope: 'openid profile api',

    silent_redirect_uri: srcHostUrl,
    automaticSilentRenew: true,
    //silentRequestTimeout:10000,

    filterProtocolClaims: true,
    loadUserInfo: true
  };
};

// Angular debug tools in the dev console
// https://github.com/angular/angular/blob/86405345b781a9dc2438c0fbe3e9409245647019/TOOLS_JS.md
let _decorateModuleRef = <T>(value: T): T => { return value; };

switch (ENV) {
  case 'production': {
    enableProdMode();

    // Production
    _decorateModuleRef = (modRef: any) => {
      disableDebugTools();
      return modRef;
    };

    PROVIDERS = [
      ...PROVIDERS,
      // custom providers in production
    ];

    setBaseUrl('http://p0test.crabyter.info/webapi', 'http://p0test.crabyter.info', 'http://p0test.crabyter.info');
  }; break;
  case 'self': {
    _decorateModuleRef = (modRef: any) => {
      const appRef = modRef.injector.get(ApplicationRef);
      const cmpRef = appRef.components[0];

      let _ng = (<any>window).ng;
      enableDebugTools(cmpRef);
      (<any>window).ng.probe = _ng.probe;
      (<any>window).ng.coreTokens = _ng.coreTokens;
      return modRef;
    };

    // Development
    PROVIDERS = [
      ...PROVIDERS,
      // custom providers in development
    ];
    setBaseUrl('http://localhost:9240', 'http://localhost:3000', 'http://localhost:44357')
  }; break;
  default: {
    _decorateModuleRef = (modRef: any) => {
      const appRef = modRef.injector.get(ApplicationRef);
      const cmpRef = appRef.components[0];

      let _ng = (<any>window).ng;
      enableDebugTools(cmpRef);
      (<any>window).ng.probe = _ng.probe;
      (<any>window).ng.coreTokens = _ng.coreTokens;
      return modRef;
    };

    // Development
    PROVIDERS = [
      ...PROVIDERS,
      // custom providers in development
    ];

    setBaseUrl('http://p0dev.crabyter.info/webapi', 'http://localhost:3000', 'http://p0test.crabyter.info');
  }; break;
}

export const decorateModuleRef = _decorateModuleRef;
export const ENV_PROVIDERS = [
  ...PROVIDERS
];
export const BaseUrl = _baseUrl;
export const AuthSettings = _authSettings;
