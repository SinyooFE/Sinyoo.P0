
import { Component, OnInit, AfterViewInit, Input, ChangeDetectorRef, ViewContainerRef, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Location } from '@angular/common';

import { Overlay, overlayConfigFactory, DialogRef, ModalComponent, CloseGuard } from 'angular2-modal';
import { Modal, BSModalContext, BootstrapModalSize } from 'angular2-modal/plugins/bootstrap';

import { Observable } from 'rxjs/Observable';

import { DomainLogComponent, DomainLogContext } from './domain-log.component';
import { VariableEditorTerminologyComponent, VariableEditorTerminologyContext } from './variable-editor-terminology.component';

import { StandardService, BaseService } from '../../services';

import { TabFunctionModel } from '../../models';

import { ApprovalStatus, DomainObservationType, DomainObservationTypeEn } from 'crabyter-p0-server/Enum';
import * as server from 'crabyter-p0-server/ViewModel';

import _ from 'lodash';

export class DomainUpdateContext extends BSModalContext {
    isAdd: boolean;
    standardId: number;
    domainId: number;
}

@Component({
    // moduleId: module.id,
    selector: 'domain-update',
    styleUrls: ['domain-update.component.css'],
    templateUrl: 'domain-update.component.html'
})

export class DomainUpdateComponent implements CloseGuard, OnInit, AfterViewInit {
    domainDetail = <server.S_DomainDetailViewModel>{};
    checkDomainDetail = <server.S_DomainDetailViewModel>{};
    private context: DomainUpdateContext;

    //tab菜单
    @Input() currentEditorTab: TabFunctionModel;
    domainEditorTab: TabFunctionModel[] = [];

    //枚举
    enumDomainObservationType = DomainObservationType;
    enumDomainObservationTypeEn = DomainObservationTypeEn;
    enumApprovalStatus = ApprovalStatus;

    //编辑区域高度
    editorHeight = 0;

    //
    isShowAttribute = false;

    constructor(private overlay: Overlay,
        private vcRef: ViewContainerRef,
        private route: ActivatedRoute,
        private location: Location,
        private baseService: BaseService,
        private standardService: StandardService,
        public modal: Modal,
        private cd: ChangeDetectorRef) {

        overlay.defaultViewContainer = vcRef;
        this.route.params.subscribe(
            params => {
                this.context = <DomainUpdateContext>{
                    isAdd: params['domainid'] == 0,
                    domainId: +params['domainid'],
                    standardId: +params['standardid']
                };
                this.initialData();
            }
        );

        this.domainEditorTab.push(new TabFunctionModel('basic', '基本设置'));
        this.domainEditorTab.push(new TabFunctionModel('synonym', '同义词设置'));
        this.currentEditorTab = this.domainEditorTab[0];
    }


    ngOnInit(): void {

    }

    ngAfterViewInit(): void {
        this.baseService.contentHeight.debounceTime(500)
            .distinctUntilChanged()
            .subscribe((data) => {
                this.editorHeight = data - (this.isShowAttribute ? 440 : 300);
            });
    }

    initialData(): void {
        if (this.context.isAdd) {
            this.domainDetail = <server.S_DomainDetailViewModel>{};
            this.checkDomainDetail = _.cloneDeep(this.domainDetail);
        } else {
            this.standardService.getDomainDetail(this.context.standardId, this.context.domainId)
                .subscribe(
                (data) => {
                    this.domainDetail = data;
                    this.checkDomainDetail = _.cloneDeep(this.domainDetail);
                });
        }
    }

    /**
     * 切换tab页
     * @param item
     */
    changSelectedTab(tab: TabFunctionModel): void {
        if (!$('.variableSetting form')[0].checkValidity()) {
            let checkRes = '';
            switch (this.currentEditorTab.key) {
                case 'basic':
                    checkRes = '请先完善基本设置信息！'; break;
                case 'synonym':
                    checkRes = '请先完善同义词信息！'; break;
            }
            if (checkRes !== '') {
                this.modal.alert()
                    .title('提示')
                    .message(checkRes)
                    .okBtn('确定')
                    .size('sm')
                    .open();
                return;
            }
        }
        this.currentEditorTab = tab;
    }

    showStandardLog(): void {
        this.modal
            .open(DomainLogComponent, overlayConfigFactory({
                standardId: this.context.standardId,
                domainId: this.domainDetail.ID,
                domainName: this.domainDetail.DomainName
            }, BSModalContext));
    }

    /**
     * 删除同义词
     * @param id
     */
    deleteSynonym(synonymIndex: number) {
        _.remove(this.domainDetail.SynonymDomains, (item, index) => {
            return synonymIndex === index;
        });
    }

    /**
     * 添加同义词
     */
    addSynonym() {
        if (!this.checkSynonym()) {
            this.modal.alert()
                .title('提示')
                .message('同义词名称不能为空！')
                .okBtn('确定')
                .size('sm')
                .open();
            return;
        }

        this.domainDetail.SynonymDomains.push(
            <server.S_SynonymDomainViewModel>{
                ID: 0,
                DomainID: this.domainDetail.ID,
                Sort: 0,
                SynonymDomainName: '',
                IsDeleted: false
            });
    }

    /**
     * 检查同义词是否合法
     * 不能为空
     * 通过true,否则false
     */
    checkSynonym() {
        let tempSynonym = _.find(this.domainDetail.SynonymDomains,
            (item) => {
                return _.isNil(item.SynonymDomainName) || item.SynonymDomainName === '';
            });
        return _.isNil(tempSynonym);
    }

    /**
     * 检查是否更新
     */
    checkIsModify(): boolean {
        return !_.isEqual(this.domainDetail, this.checkDomainDetail);
    }

    /**
     * 显示基本信息
     */
    toggleBasicInfo() {
        this.isShowAttribute = !this.isShowAttribute;
        this.editorHeight = this.editorHeight - (this.isShowAttribute ? 136 : -136);
    }

    ok() {
        //如果未修改，提示不需要保存
        if (!this.checkIsModify()) {
            this.modal.alert()
                .title('提示')
                .message('您未做任何修改，不需要保存！')
                .okBtn('确定')
                .size('sm')
                .open();
            return;
        }

        if (!this.checkSynonym()) {
            this.modal.alert()
                .title('提示')
                .message('同义词名称不能为空！')
                .okBtn('确定')
                .size('sm')
                .open();
            return;
        }

        this.standardService.saveDomainDetail(this.context.standardId, this.domainDetail)
            .subscribe((data) => {
                this.modal.alert()
                    .title('提示')
                    .message('修改成功！')
                    .okBtn('确定')
                    .size('sm')
                    .open().then(data => {
                        data.result.then(ret => {
                            if (ret) {
                                this.location.back();
                            }
                        });
                    });
            });
    }

    cancel() {
        this.location.back();
    }
}