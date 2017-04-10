import { Component, OnInit, ViewContainerRef, ViewEncapsulation } from '@angular/core';

import { DialogRef, ModalComponent, CloseGuard } from 'angular2-modal';
import { BSModalContext, BootstrapModalSize } from 'angular2-modal/plugins/bootstrap';

import { TerminologyService } from '../../services/terminology';

import { LogAction, LogAuditAction } from 'crabyter-p0-server/Enum';
import * as server from 'crabyter-p0-server/ViewModel';

import _ from 'lodash';

export class ConceptLogContext extends BSModalContext {
    conceptId: string;
    conceptName: string;
}

export class SelectedConceptLog {
    selectedLog: server.T_ConceptLogViewModel;
    originalConcept: server.T_ConceptDetailViewModel;
    currentConcept: server.T_ConceptDetailViewModel;

    attributes: any[];
    synonymes: any[];

    constructor(log: server.T_ConceptLogViewModel = null) {
        if (null != log) {
            this.selectedLog = log;
            this.originalConcept = (log.OriginalValue != null && log.OriginalValue != '')
                ? JSON.parse(log.OriginalValue)
                : <server.T_ConceptDetailViewModel>{};
            this.currentConcept = (log.CurrentValue != null && log.CurrentValue != '')
                ? JSON.parse(log.CurrentValue)
                : <server.T_ConceptDetailViewModel>{};
        } else {
            this.selectedLog = <server.T_ConceptLogViewModel>{};
            this.originalConcept = <server.T_ConceptDetailViewModel>{};
            this.currentConcept = <server.T_ConceptDetailViewModel>{};
        }

        if (this.originalConcept.Attributes === undefined || this.originalConcept.Attributes === null) {
            this.originalConcept.Attributes = [];
        }
        if (this.originalConcept.Synonymes === undefined || this.originalConcept.Synonymes === null) {
            this.originalConcept.Synonymes = [];
        }
        if (this.currentConcept.Attributes === undefined || this.currentConcept.Attributes === null) {
            this.currentConcept.Attributes = [];
        }
        if (this.currentConcept.Synonymes === undefined || this.currentConcept.Synonymes === null) {
            this.currentConcept.Synonymes = [];
        }
        this.attributes = [];
        this.synonymes = [];

        this.initAttributeAndSynonymes();
    }

    initAttributeAndSynonymes(): void {
        let attributeLength = this.originalConcept.Attributes.length > this.currentConcept.Attributes.length
            ? this.originalConcept.Attributes.length
            : this.currentConcept.Attributes.length;
        let synonymeLength = this.originalConcept.Synonymes.length > this.currentConcept.Synonymes.length
            ? this.originalConcept.Synonymes.length
            : this.currentConcept.Synonymes.length;

        //console.log(this.originalConcept.Attributes);
        //console.log(this.currentConcept.Attributes);
        for (let i = 0; i < attributeLength; i++) {
            let tempAttr = { key: '', value: '' };
            if (i < this.originalConcept.Attributes.length) {
                if (!_.isNil(this.originalConcept.Attributes[i].ConceptTypeAttribute.AttributeName)) {
                    if (_.isNil(this.originalConcept.Attributes[i].AttributeValue)) {
                        tempAttr.key = `${this.originalConcept.Attributes[i].ConceptTypeAttribute.AttributeName}`;
                    } else {
                        tempAttr.key = `${this.originalConcept.Attributes[i].ConceptTypeAttribute.AttributeName} ${this.originalConcept.Attributes[i].AttributeValue}`;
                    }
                }
            }
            if (i < this.currentConcept.Attributes.length) {
                if (!_.isNil(this.currentConcept.Attributes[i].ConceptTypeAttribute.AttributeName)) {
                    if (_.isNil(this.currentConcept.Attributes[i].AttributeValue)) {
                        tempAttr.value = `${this.currentConcept.Attributes[i].ConceptTypeAttribute.AttributeName}`;
                    } else {
                        tempAttr.value = `${this.currentConcept.Attributes[i].ConceptTypeAttribute.AttributeName} ${this.currentConcept.Attributes[i].AttributeValue}`;
                    }
                }
            }
            //console.log(tempAttr);
            this.attributes.push(tempAttr);
        }

        for (let i = 0; i < synonymeLength; i++) {
            let tempSyno = { key: '', value: '' };
            if (i < this.originalConcept.Synonymes.length) {
                tempSyno.key = this.originalConcept.Synonymes[i].SynonymName;
            }
            if (i < this.currentConcept.Synonymes.length) {
                tempSyno.value = this.currentConcept.Synonymes[i].SynonymName;
            }
            //console.log(tempSyno);
            this.synonymes.push(tempSyno);
        }
    }
}


@Component({
    // moduleId: module.id,
    selector: 'concept-log',
    styleUrls: ['concept-log.component.css'],
    templateUrl: 'concept-log.component.html'
})

export class ConceptLogComponent implements CloseGuard, OnInit, ModalComponent<ConceptLogContext>  {
    context: ConceptLogContext;
    conceptLogList: server.T_ConceptLogViewModel[];
    selectedConceptLog = new SelectedConceptLog();

    //枚举
    enumLogAction = LogAction;
    enumLogAuditAction = LogAuditAction;

    constructor(public dialog: DialogRef<ConceptLogContext>, private terminologyService: TerminologyService) {
        dialog.context.dialogClass = "modal-dialog concept-modal-dialog";
        dialog.context.inElement = true;
        dialog.setCloseGuard(this);
        this.context = dialog.context;
    }

    /**
     * 初始化数据
     */
    ngOnInit(): void {
        if (this.context.conceptId !== undefined
            && this.context.conceptId !== null
            && this.context.conceptId !== '') {
            this.terminologyService.getConceptLog(this.context.conceptId)
                .subscribe((rep) => {
                    this.conceptLogList = rep;
                    if (this.conceptLogList != undefined &&
                        this.conceptLogList != null &&
                        this.conceptLogList.length > 0) {
                        this.selectedConceptLog = new SelectedConceptLog(this.conceptLogList[0]);
                    }
                });
        }
    }

    setSelectedConceptLog(log: server.T_ConceptLogViewModel): void {
        this.selectedConceptLog = new SelectedConceptLog(log);
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

    /**
     * 保存标准
     */
    ok() {

    }

    /**
     * 取消
     */
    cancel() {
        this.dialog.close({ IsOk: false });
    }
}