/**
* 域编辑(新增)界面
*/
import { Component, OnInit, ViewContainerRef, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Location } from '@angular/common';

import { DialogRef, ModalComponent, CloseGuard, overlayConfigFactory } from 'angular2-modal';
import { BSModalContext, BootstrapModalSize, Modal } from 'angular2-modal/plugins/bootstrap';

import { DomainSynonymEditorDialog } from './domain-synonym-editor.dialog'

import { StandardService } from '../../services/';

import { TabFunctionModel } from '../../models';
import { DomainObservationType, DomainObservationTypeEn } from 'crabyter-p0-server/Enum';
import * as server from 'crabyter-p0-server/ViewModel';

import _ from 'lodash';

export class DomainEditorContext extends BSModalContext {
    isAdd: boolean;
    domainId: number;
    standardId: number;

    //域列表
    domainList: Array<server.S_DomainViewModel> = [];
}

@Component({
    // moduleId: module.id,
    selector: 'domain-editor',
    styleUrls: ['domain-editor.component.css'],
    templateUrl: 'domain-editor.component.html'
})
export class DomainEditorComponent implements CloseGuard, OnInit, ModalComponent<DomainEditorContext> {
    domainDetail = <server.S_DomainDetailViewModel>{};
    context: DomainEditorContext;

    public standardDetail: server.S_StandardDetailViewModel;

    //tab菜单
    currentEditorTab: TabFunctionModel;
    domainEditorTab: TabFunctionModel[] = [];

    //枚举
    enumDomainObservationType = DomainObservationType;
    enumDomainObservationTypeEn = DomainObservationTypeEn;

    constructor(
        public dialog: DialogRef<DomainEditorContext>,
        private location: Location,
        private standardService: StandardService,
        private modal: Modal) {

        dialog.context.size = 'lg';
        dialog.context.inElement = true;
        dialog.setCloseGuard(this);
        this.context = <DomainEditorContext>dialog.context;

        this.domainEditorTab.push(new TabFunctionModel('basic', '基本信息'));
        this.domainEditorTab.push(new TabFunctionModel('synonym', '同义词设置'));
        this.currentEditorTab = this.domainEditorTab[0];

        this.initialData();
    }

    /**
     * 初始化数据
     */
    ngOnInit(): void {
        this.initialData();
    }

    initialData(): void {
        if (this.context.isAdd) {
            this.domainDetail = <server.S_DomainDetailViewModel>{
                ID: 0,
                StandardID: this.context.standardId,
                SynonymDomains: []
            };
        } else {
            this.standardService.getDomainDetail(this.context.standardId, this.context.domainId)
                .subscribe(
                (data) => {
                    this.domainDetail = data;
                });
        }
    }

    /**
     * 切换tab页
     * @param item
     */
    changeSelectedTab(tab: TabFunctionModel) {
        if (!$('.modal-content form')[0].checkValidity()) {
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
            return;
        }
        this.currentEditorTab = tab;
    }

    /**
     * 删除同义词
     * @param synomId
     */
    deleteSynonym(synonymIndex: number) {
        _.remove(this.domainDetail.SynonymDomains, (item, index) => {
            return index === synonymIndex;
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

        this.domainDetail.SynonymDomains.push(<server.S_SynonymDomainViewModel>{
            ID: 0,
            DomainID: this.domainDetail.ID,
            IsDeleted: false,
            Sort: 1,
            SynonymDomainName: ""
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
     * 确认域的修改
     */
    ok() {
        //重名验证
        if (_.findIndex(this.context.domainList, (item) => { return item.DomainName === this.domainDetail.DomainName; }) > -1) {
            this.modal.alert()
                .title('提示')
                .message('域中文名重复！')
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
            .subscribe(
            (data) => {
                this.dialog.close({ IsOk: true, Model: data });
            });
    }
    /**
     * 取消域的修改
     */
    cancel() {
        this.dialog.close({ IsOk: false });
    }

    onclose(ok: boolean) {
        this.dialog.close({ IsOk: ok });
    }

    beforeDismiss(): boolean {
        return false;
    }

    beforeClose(): boolean {
        return false;
    }
}