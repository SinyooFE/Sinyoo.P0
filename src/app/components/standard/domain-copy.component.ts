/**
* 域复制组件
*/
import { Component, OnInit, ViewContainerRef, ViewEncapsulation } from '@angular/core';

import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import { DialogRef, ModalComponent, CloseGuard } from 'angular2-modal';
import { Modal, BSModalContext, BootstrapModalSize } from 'angular2-modal/plugins/bootstrap';

import { StandardService } from '../../services/';

import { CopyDomainInfo, CopyFieldInfo, SelectedFieldInfo } from '../../models/';
import * as server from 'crabyter-p0-server/ViewModel';

import _ from 'lodash';

export class DomainCopyContext extends BSModalContext {
    isCopyDomain: boolean;
    standardId: number;
    domainId: number;
}

@Component({
    // moduleId: module.id,
    selector: 'domain-copy',
    styleUrls: ['domain-copy.component.css'],
    templateUrl: 'domain-copy.component.html'
})
export class DomainCopyComponent implements CloseGuard, OnInit, ModalComponent<DomainCopyContext> {
    context: DomainCopyContext;

    //标准列表
    private standardList: Array<server.S_StandardCoypViewModel> = [];
    //域列表
    private domainList: Array<CopyDomainInfo> = [];
    //变量列表
    private vairableList: Array<CopyFieldInfo> = [];

    //已选列表
    private selectedFieldList: Array<SelectedFieldInfo> = [];

    private currStandardId: number;
    private currStandardName: string;
    private currDomainId: number;
    private currDomainName: string;

    constructor(public dialog: DialogRef<DomainCopyContext>,
        public modal: Modal,
        private standardService: StandardService) {
        dialog.context.size = 'lg';
        dialog.context.inElement = false;
        dialog.setCloseGuard(this);

        this.context = dialog.context;
        console.log(this.context);
    }

    ngOnInit(): void {
        //this.standardService.getStandardList()
        this.standardService.getStandardForCopy(false)
            .subscribe(
            (data) => {
                this.standardList = data;
                if (this.standardList.length > 0) {
                    this.updateDomain(this.standardList[0].ID, this.standardList[0].StandardName);
                }
            });
    }

    changeStandard(standardId: number, name: string) {
        if (this.currStandardId !== standardId) {
            this.updateDomain(standardId, name);
        }
    }

    changeDomain(domainId: number, name: string) {
        if (this.currDomainId !== domainId) {
            this.updateVariable(domainId, name);
        }
    }

    /**
     * 选择变量
     * @param variable
     * @param isUpdate 是否添加多条
     */
    changeVariable(variable: CopyFieldInfo, isUpdate = true) {
        if (variable.IsSelected) {
            _.remove(this.selectedFieldList, (item) => { return item.variableId === variable.ID });
        } else {
            this.selectedFieldList.push(<SelectedFieldInfo>{
                standardId: this.currStandardId,
                standardName: this.currStandardName,
                domainId: this.currDomainId,
                domainName: this.currDomainName,
                variableId: variable.ID,
                variableName: variable.FieldName
            });
        }
        if (isUpdate) {
            this.setVariableListSelectedStatus(variable.ID);
            this.setDomainListSelectedStatus(variable.DomainID);
        }
    }

    private updateDomain(standardId: number, standardName: string) {
        this.currStandardId = standardId;
        this.currStandardName = standardName;

        this.standardService.getDomainListForCopy(standardId)
            .subscribe(
            (data) => {
                this.domainList = [];
                this.vairableList = [];

                if (!_.isNil(data)) {
                    this.domainList = this.domainList.concat(data as Array<CopyDomainInfo>);

                    //如果有域数据,那么更新变量列表
                    if (this.domainList.length > 0) {
                        this.updateVariable(this.domainList[0].ID, this.domainList[0].DomainName);
                    }
                }

                //更新选中状态
                this.setDomainListSelectedStatus();
            });
    }

    private updateVariable(domainId: number, domainName: string) {
        this.currDomainId = domainId;
        this.currDomainName = domainName;

        this.standardService.getVairableListForCopy(this.currStandardId, domainId)
            .subscribe(
            (data) => {
                this.vairableList = [];
                if (!_.isNil(data)) {
                    this.vairableList = this.vairableList.concat(data as Array<CopyFieldInfo>);
                }

                //更新选中状态
                this.setVariableListSelectedStatus();
            });
    }

    /**
     * 域全选
     * @param domain
     */
    toggleSelectedAll(domain: CopyDomainInfo): void {
        //点击对象不是当前domian,需要切换到当前域
        if (this.currDomainId !== domain.ID) {
            this.changeDomain(domain.ID, domain.DomainName);
        }

        switch (domain.SelectedStatus) {
            case 0:
            case 1:
                {
                    //未选变全选
                    this.vairableList.forEach((value, index, array) => {
                        //不存在，push进已选数组
                        if (_.findIndex(this.selectedFieldList, (item) => { return item.variableId === value.ID; }) === -1) {
                            this.changeVariable(value, false);
                        }
                    });
                }; break;
            case 2:
                {
                    //全选变未选
                    this.vairableList.forEach((value, index, array) => {
                        //存在，从数组中删除
                        if (_.findIndex(this.selectedFieldList, (item) => { return item.variableId === value.ID; }) > -1) {
                            this.changeVariable(value, false);
                        }
                    });
                }; break;
        }

        //更新
        this.setVariableListSelectedStatus();
        this.setDomainListSelectedStatus();
    }

    /**
     * 移除选中的变量
     * @param variableId
     * @param domainId
     */
    private removeSelectedFieldList(variableId: number, domainId: number): void {
        _.remove(this.selectedFieldList, (item, index) => {
            return variableId === item.variableId;
        });
        this.setVariableListSelectedStatus(variableId);
        this.setDomainListSelectedStatus(domainId);
    }

    /**
     * 设置全部domainList的SelectedStatus，或者设置单个
     * @param domainId
     */
    setDomainListSelectedStatus(domainId: number = null): void {
        if (domainId === null) {
            _.map(this.domainList,
                (listItem) => {
                    let tempSelectedFields = _.filter(this.selectedFieldList, (item) => { return listItem.ID === item.domainId; });

                    if (tempSelectedFields.length === 0) {
                        listItem.SelectedStatus = 0;
                    } else if (tempSelectedFields.length === listItem.FieldsCount) {
                        listItem.SelectedStatus = 2;
                    } else {
                        listItem.SelectedStatus = 1;
                    }
                });
        } else {
            let tempField = _.find(this.domainList,
                (listItem) => { return domainId === listItem.ID; });

            if (!_.isNil(tempField)) {
                let tempSelectedFields = _.filter(this.selectedFieldList, (item) => { return domainId === item.domainId; });

                if (tempSelectedFields.length === 0) {
                    tempField.SelectedStatus = 0;
                } else if (tempSelectedFields.length === tempField.FieldsCount) {
                    tempField.SelectedStatus = 2;
                } else {
                    tempField.SelectedStatus = 1;
                }
            }
        }
    }

    /**
     * 设置全部vairableList的IsSelected，或者单个
     */
    setVariableListSelectedStatus(fieldId: number = null): void {
        if (fieldId === null) {
            _.map(this.vairableList,
                (listItem) => {
                    let tempIndex = _.findIndex(this.selectedFieldList,
                        (selectedItem) => { return listItem.ID === selectedItem.variableId; });

                    listItem.IsSelected = (tempIndex > -1);
                });
        } else {
            let tempField = _.find(this.vairableList,
                (listItem) => { return fieldId === listItem.ID; });

            if (!_.isNil(tempField)) {
                let tempIndex = _.findIndex(this.selectedFieldList,
                    (selectedItem) => { return fieldId === selectedItem.variableId; });

                tempField.IsSelected = (tempIndex > -1);
            }
        }
    }

    /**
     * 确认复制
     */
    ok() {
        //判断是否已选变量
        if (this.selectedFieldList.length === 0) {
            this.modal.alert()
                .title('提示')
                .message('请选择需要复制的变量！')
                .okBtn('确定')
                .size('sm')
                .open();
            return;
        }

        //复制域和复制变量
        //只需要ID信息就够了
        let variables = [];
        this.selectedFieldList.forEach((item) => {
            variables.push({
                ID: item.variableId
            });
        });
        if (this.context.isCopyDomain) {
            this.standardService.copyDomain(this.context.standardId, variables as Array<SelectedFieldInfo>)
                .subscribe((data) => {
                    this.dialog.close({ IsOk: true, model: data });
                });
        } else {
            this.standardService.copyVariable(this.context.standardId, this.context.domainId, variables as Array<SelectedFieldInfo>)
                .subscribe((data) => {
                    this.dialog.close({ IsOk: true, model: data });
                });
        }
    }

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