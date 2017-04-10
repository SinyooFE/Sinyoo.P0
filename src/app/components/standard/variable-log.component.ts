
import { Component, OnInit, ViewContainerRef, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';

import { DialogRef, ModalComponent, CloseGuard } from 'angular2-modal';
import { BSModalContext, BootstrapModalSize, Modal } from 'angular2-modal/plugins/bootstrap';

import { TerminologyService, StandardService } from '../../services';

import { FieldCannotEnumOptions } from '../../models';
import {
    AttributeType, ConceptDislpayList, LogAction, LogAuditAction, FieldCoreCategory,
    FieldCoreCategoryEn, FieldRole, FieldRoleEn, FieldDataType, FieldType, FieldStatisticType,
    FieldIsPrivate, FieldDataLevel, FieldControlType, FieldControlTermFormat    
} from 'crabyter-p0-server/Enum';
import * as server from 'crabyter-p0-server/ViewModel';

import _ from 'lodash';

export class VariableLogContext extends BSModalContext {
    standardId: number;
    domainId: number;
    variableId: number;
    variableName: string;
}

class SelectedVariableLog {
    selectedLog: server.S_LogViewModel;
    originalDetail: server.S_FieldDetailViewModel;
    currentDetail: server.S_FieldDetailViewModel;

    originalReturnValue: string;
    currentReurnValue: string;

    options: any[];
    synonyms: any[];

    constructor(log: server.S_LogViewModel = null) {
        if (log === undefined || log === null) {
            this.selectedLog = <server.S_LogViewModel>{};
            this.originalDetail = <server.S_FieldDetailViewModel>{};
            this.currentDetail = <server.S_FieldDetailViewModel>{};
        } else {
            this.selectedLog = log;
            this.originalDetail = (log.OriginalValue != null && log.OriginalValue != '')
                ? JSON.parse(log.OriginalValue)
                : <server.S_FieldDetailViewModel>{};
            this.currentDetail = (log.CurrentValue != null && log.CurrentValue != '')
                ? JSON.parse(log.CurrentValue)
                : <server.S_FieldDetailViewModel>{};
        }

        if (this.originalDetail.Options === undefined || this.originalDetail.Options === null) {
            this.originalDetail.Options = [];
        }
        if (this.originalDetail.SynonymFields === undefined || this.originalDetail.SynonymFields === null) {
            this.originalDetail.SynonymFields = [];
        }
        if (this.currentDetail.Options === undefined || this.currentDetail.Options === null) {
            this.currentDetail.Options = [];
        }
        if (this.currentDetail.SynonymFields === undefined || this.currentDetail.SynonymFields === null) {
            this.currentDetail.SynonymFields = [];
        }
        this.options = [];
        this.synonyms = [];

        this.initFieldsAndSynonymes();
    }

    initFieldsAndSynonymes(): void {
        let fieldLength = this.originalDetail.Options.length > this.currentDetail.Options.length
            ? this.originalDetail.Options.length
            : this.currentDetail.Options.length;
        let synonymLength = this.originalDetail.SynonymFields.length > this.currentDetail.SynonymFields.length
            ? this.originalDetail.SynonymFields.length
            : this.currentDetail.SynonymFields.length;

        for (let i = 0; i < fieldLength; i++) {
            let tempField = { key: '', value: '' };
            if (i < this.originalDetail.Options.length) {
                tempField.key = this.originalDetail.Options[i].OptionValue;
            }
            if (i < this.currentDetail.Options.length) {
                tempField.value = this.currentDetail.Options[i].OptionValue;
            }
            this.options.push(tempField);
        }

        for (let i = 0; i < synonymLength; i++) {
            let tempSyno = { key: '', value: '' };
            if (i < this.originalDetail.SynonymFields.length) {
                tempSyno.key = this.originalDetail.SynonymFields[i].SynonymFieldName;
            }
            if (i < this.currentDetail.SynonymFields.length) {
                tempSyno.value = this.currentDetail.SynonymFields[i].SynonymFieldName;
            }
            this.synonyms.push(tempSyno);
        }
    }
}

@Component({
    // moduleId: module.id,
    selector: 'variable-log',
    styleUrls: ['variable-log.component.css'],
    templateUrl: 'variable-log.component.html'
})

export class VariableLogComponent implements CloseGuard, OnInit, ModalComponent<VariableLogContext> {
    context: VariableLogContext;

    variableLogList: Array<server.S_LogViewModel>;
    selectedVariableLog = new SelectedVariableLog();

    originalAttributes: any[];
    currentAttributes: any[];

    //枚举
    enumAttributeType = AttributeType;
    enumConceptDislpayList = ConceptDislpayList;
    enumLogAction = LogAction;
    enumLogAuditAction = LogAuditAction;
    enumFieldCoreCategory = FieldCoreCategory;
    enumFieldCoreCategoryEn = FieldCoreCategoryEn;
    enumFieldRole = FieldRole;
    enumFieldRoleEn = FieldRoleEn;
    enumFieldDataType = FieldDataType;
    enumFieldType = FieldType;
    enumFieldStatisticType = FieldStatisticType;
    enumFieldIsPrivate = FieldIsPrivate;
    enumFieldDataLevel = FieldDataLevel;
    enumFieldControlType = FieldControlType;
    enumFieldControlTermFormat = FieldControlTermFormat;

    //无法枚举的值
    fieldCannotEnumOptions = new FieldCannotEnumOptions();

    constructor(public dialog: DialogRef<VariableLogContext>, private terminologyService: TerminologyService,
        private standardService: StandardService, private modal: Modal) {
        dialog.context.dialogClass = 'modal-dialog standard-modal-dialog';
        dialog.context.inElement = false;
        dialog.setCloseGuard(this);

        this.context = dialog.context;
    }

    ngOnInit(): void {
        this.standardService.getVariableLog(this.context.standardId, this.context.domainId, this.context.variableId)
            .subscribe((data) => {
                this.variableLogList = data;
                if (this.variableLogList.length > 0) {
                    this.setSelectedLog(this.variableLogList[0]);
                }
            });
    }


    /**
    * 设置选中的日志
    * @param log
    */
    setSelectedLog(log: server.S_LogViewModel): void {
        this.selectedVariableLog = new SelectedVariableLog(log);
        if (!_.isNil(this.selectedVariableLog.originalDetail.ConceptTypeID) && this.selectedVariableLog.originalDetail.ConceptTypeID !== '') {
            this.terminologyService.getConceptTypeAttributesForStandard(this.selectedVariableLog.originalDetail.ConceptTypeID)
                .subscribe((data) => {
                    this.originalAttributes = data;

                    let tempAttr = _.find(this.originalAttributes,
                        (item) => { return item.AttributeID === this.selectedVariableLog.originalDetail.ReturnValue; });
                    if (!_.isNil(tempAttr)) {
                        if (tempAttr.AttributeType === AttributeType.关系属性) {
                            this.selectedVariableLog.originalReturnValue = `${tempAttr.AttributeName} ${ConceptDislpayList[this.selectedVariableLog.originalDetail.RelatedReturnValue]}`;
                        } else {
                            this.selectedVariableLog.originalReturnValue = tempAttr.AttributeName;
                        }
                    }
                });
        }
        if (!_.isNil(this.selectedVariableLog.currentDetail.ConceptTypeID) && this.selectedVariableLog.currentDetail.ConceptTypeID !== '') {
            this.terminologyService.getConceptTypeAttributesForStandard(this.selectedVariableLog.currentDetail.ConceptTypeID)
                .subscribe((data) => {
                    this.currentAttributes = data;

                    let tempAttr = _.find(this.currentAttributes,
                        (item) => { return item.AttributeID === this.selectedVariableLog.currentDetail.ReturnValue; });
                    if (!_.isNil(tempAttr)) {
                        if (tempAttr.AttributeType === AttributeType.关系属性) {
                            this.selectedVariableLog.currentReurnValue = `${tempAttr.AttributeName} ${ConceptDislpayList[this.selectedVariableLog.currentDetail.RelatedReturnValue]}`;
                        } else {
                            this.selectedVariableLog.currentReurnValue = tempAttr.AttributeName;
                        }
                        console.log(this.selectedVariableLog.currentReurnValue);
                    }
                });
        }
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

    ok() {

    }

    /**
     * 取消
     */
    cancel() {
        this.dialog.close({ IsOk: false });
    }
}