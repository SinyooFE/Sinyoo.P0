/**
* 标准入口界面
*/

import { Component, OnInit, ViewContainerRef, ViewEncapsulation, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';

import { Overlay, overlayConfigFactory } from 'angular2-modal';
import { Modal, BSModalContext } from 'angular2-modal/plugins/bootstrap';

import { StandardListComponent } from './standard-list.component';
import { DomainListComponent } from './domain-list.component';
import { VariableListComponent } from './variable-list.component';

import { LOCAL_STORAGE_STANDARD_KEY, LocalStorageStandardModel } from '../../models';

import { QueryAuthorizeInfo, AuthorizeInfo, StandardService, BaseService } from '../../services';

import * as server from 'crabyter-p0-server/ViewModel';

import _ from 'lodash';

@Component({
    // moduleId: module.id,
    selector: 'standard-index',
    styleUrls: ['standard-index.component.css'],
    templateUrl: 'standard-index.component.html'
})
export class StandardIndexComponent implements OnInit, AfterViewInit {
    @ViewChild(StandardListComponent) standardList: StandardListComponent;
    @ViewChild(DomainListComponent) domainList: DomainListComponent;
    @ViewChild(VariableListComponent) variableList: VariableListComponent;

    private currStandard = <server.S_StandardViewModel>{};
    private currDomain = <server.S_DomainViewModel>{};

    constructor(private router: Router,
        private overlay: Overlay,
        private vcRef: ViewContainerRef,
        public modal: Modal,
        public standardService: StandardService,
        public baseService: BaseService) {
        overlay.defaultViewContainer = vcRef;
    }

    ngOnInit(): void {
        this.standardList.reportStandard
            .subscribe(
            (standard) => {
                this.currStandard = standard;
                this.domainList.updateStandard(this.currStandard);
            });

        this.domainList.reportDomain
            .subscribe
            ((domain) => {
                console.log(domain);
                if (!_.isNil(domain)) {
                    this.currDomain = domain;
                } else {
                    this.currDomain = <server.S_DomainViewModel>{
                        ID: null,
                        DomainName: ''
                    };
                }
                this.variableList.updateDomainId(this.currStandard.ID, this.currDomain.ID, this.currDomain.DomainName);

                //保存信息到localStorage
                let lsModel = <LocalStorageStandardModel>{
                    standard: this.currStandard,
                    domain: this.currDomain
                };
                this.standardService.setLastStandardInfo(lsModel);
            });
    }

    ngAfterViewInit() {

    }

    /**
     * 提交选择的标准
     */
    submitSelectedStandard(): void {
        this.standardService.submitStandard(this.currStandard.ID)
            .subscribe((data) => {
                //改变状态
                this.standardList.afterSubmitStandard(this.currStandard.ID);
                this.modal.alert()
                    .title('提示')
                    .message('提交成功！')
                    .okBtn('确定')
                    .size('sm')
                    .open();
            });
    }
}