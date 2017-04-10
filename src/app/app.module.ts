import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { NgModule, ApplicationRef } from '@angular/core';
import { removeNgStyles, createNewHosts, createInputTransfer } from '@angularclass/hmr';
import { RouterModule, PreloadAllModules } from '@angular/router';

/*
 * Platform and Environment providers/directives/pipes
 */
import { ENV_PROVIDERS } from './environment';
import { ROOTROUTES, CHILDROUTES } from './app.routes';

/**组件 */
import { ModalModule } from 'angular2-modal';
import { BootstrapModalModule } from 'angular2-modal/plugins/bootstrap';
import { BusyModule } from 'angular2-busy';
import { Ng2Webstorage } from 'ng2-webstorage';
import { Ng2PageScrollModule } from 'ng2-page-scroll';
import { PaginationModule } from 'ng2-bootstrap/pagination';

// App is our top level component
import { AppComponent } from './components';
import { APP_RESOLVER_PROVIDERS } from './app.resolver';
import { AppService, InternalStateType } from './services/app.service';

/*权限*/
import * as Auth from './components/authenication';
/*肿瘤叙词表*/
import * as Terminology from './components/terminology';
/*数据模板*/
import * as Standard from './components/standard';
/*Mapping*/
import * as Mapping from './components/mapping';
/*我的工作*/
import * as MyTask from './components/mytask';
/*common*/
import * as Common from './components/common';
/*user*/
import * as User from './components/user';

import '../styles/styles.scss';
import '../styles/headings.css';

// Application wide providers
const APP_PROVIDERS = [
  ...APP_RESOLVER_PROVIDERS,
  AppService
];

type StoreType = {
  state: InternalStateType,
  restoreInputValues: () => void,
  disposeOldHosts: () => void
};

/**
 * `AppModule` is the main entry point into Angular2's bootstraping process
 */
@NgModule({
  bootstrap: [AppComponent],
  declarations: [
    AppComponent,
    Auth.AuthenicationComponent,
    /**
     *概念相关 
     */
    Terminology.ConceptIndexComponent,
    Terminology.ConceptEditorComponent,
    Terminology.ConceptTreeComponent,
    Terminology.ConceptTreeTypeSelectComponent,
    Terminology.ConceptTypeIndexComponent,
    Terminology.ConceptLogComponent,
    Terminology.ConceptAttributeComponent,
    Terminology.ConceptSynonymComponent,
    Terminology.ConceptTypeAttributeEditorComponent,
    Terminology.ConceptTypeEditorComponent,
    /**
     * 标准相关
     */
    Standard.DomainEditorComponent,
    Standard.DomainUpdateComponent,
    Standard.DomainCopyComponent,
    Standard.DomainListComponent,
    Standard.StandardCopyComponent,
    Standard.StandardEditorComponent,
    Standard.StandardUpdateComponent,
    Standard.StandardIndexComponent,
    Standard.StandardListComponent,
    Standard.StandardLogComponent,
    Standard.DomainLogComponent,
    Standard.VariableLogComponent,
    Standard.VariableEditorComponent,
    Standard.VariableEditorTerminologyComponent,
    Standard.VariableListComponent,
    Standard.DomainSynonymEditorDialog,
    /**
     * 我的工作
     */
    MyTask.OptionSelectDialog,
    MyTask.ConceptCompareDialog,
    MyTask.StandardCompareDialog,
    MyTask.DomainCompareDialog,
    MyTask.VariableCompareDialog,
    MyTask.MyTaskListComponent,
    MyTask.MyTaskComponent,
    /**
     * Common
     */
    Common.enumKeyValuesPipe,
    Common.numToArrayPipe,
    Common.mappingRulesPipe,
    /**
     * Mapping
     */
    Mapping.MappingIndexComponent,
    Mapping.MappingConfigComponent,
    Mapping.MappingMatchIndexComponent,
    Mapping.MappingMatchOptionComponent,
    Mapping.MappingMatchFilterComponent,
    /**
     * User用户相关，-修改密码弹窗
     */
    User.UserChangePasswordLogComponent
  ],
  imports: [ // import Angular's modules
    BrowserModule,
    FormsModule,
    HttpModule,
    RouterModule.forRoot(ROOTROUTES),
    // RouterModule.forChild(CHILDROUTES),

    ModalModule.forRoot(),
    BootstrapModalModule,
    Ng2Webstorage,
    /**
     *  The forRoot method allows to configure the prefix and the separator used by the library
     */
    Ng2Webstorage.forRoot({ prefix: 'SINYOO_P0', separator: '_' }),
    BusyModule,
    Ng2PageScrollModule.forRoot(),
    PaginationModule.forRoot()
  ],
  providers: [ // expose our Services and Providers into Angular's dependency injection
    ENV_PROVIDERS,
    APP_PROVIDERS
  ],
  // IMPORTANT: 
  // Since 'AdditionCalculateWindow' is never explicitly used (in a template)
  // we must tell angular about it.
  //因为这些对话框一直没有在template中使用过,我们必须直接告诉NG把它包括进来
  entryComponents: [
    MyTask.OptionSelectDialog,
    MyTask.ConceptCompareDialog,
    MyTask.StandardCompareDialog,
    MyTask.DomainCompareDialog,
    MyTask.VariableCompareDialog,

    Standard.StandardEditorComponent,
    Standard.StandardCopyComponent,
    Standard.DomainEditorComponent,
    Standard.DomainCopyComponent,
    Standard.StandardLogComponent,
    Standard.DomainLogComponent,
    Standard.VariableLogComponent,

    Terminology.ConceptLogComponent,
    Terminology.ConceptTreeTypeSelectComponent,
    Terminology.ConceptAttributeComponent,
    Terminology.ConceptSynonymComponent,
    Terminology.ConceptTypeEditorComponent,
    Terminology.ConceptTypeAttributeEditorComponent,

    Standard.VariableEditorComponent,
    Standard.VariableEditorTerminologyComponent,
    Standard.DomainSynonymEditorDialog,

    Mapping.MappingConfigComponent,
    Mapping.MappingMatchFilterComponent,
    /**
     * User用户相关，-修改密码弹窗
     */
    User.UserChangePasswordLogComponent
  ]
})

export class AppModule {

  // constructor(
  //   public appRef: ApplicationRef,
  //   public appState: AppService
  // ) { }

  // public hmrOnInit(store: StoreType) {
  //   if (!store || !store.state) {
  //     return;
  //   }
  //   console.log('HMR store', JSON.stringify(store, null, 2));
  //   // set state
  //   this.appState._state = store.state;
  //   // set input values
  //   if ('restoreInputValues' in store) {
  //     let restoreInputValues = store.restoreInputValues;
  //     setTimeout(restoreInputValues);
  //   }

  //   this.appRef.tick();
  //   delete store.state;
  //   delete store.restoreInputValues;
  // }

  // public hmrOnDestroy(store: StoreType) {
  //   const cmpLocation = this.appRef.components.map((cmp) => cmp.location.nativeElement);
  //   // save state
  //   const state = this.appState._state;
  //   store.state = state;
  //   // recreate root elements
  //   store.disposeOldHosts = createNewHosts(cmpLocation);
  //   // save input values
  //   store.restoreInputValues = createInputTransfer();
  //   // remove styles
  //   removeNgStyles();
  // }

  // public hmrAfterDestroy(store: StoreType) {
  //   // display new elements
  //   store.disposeOldHosts();
  //   delete store.disposeOldHosts;
  // }

}
