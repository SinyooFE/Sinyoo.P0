
import { Component, OnInit, ViewContainerRef, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';

import { DialogRef, ModalComponent, CloseGuard } from 'angular2-modal';
import { BSModalContext, BootstrapModalSize, Modal } from 'angular2-modal/plugins/bootstrap';

import { StandardService } from '../../services';

import { LogAction, LogAuditAction, DomainObservationType, DomainObservationTypeEn } from 'crabyter-p0-server/Enum';
import * as server from 'crabyter-p0-server/ViewModel';

import _ from 'lodash';

export class DomainLogContext extends BSModalContext {
    standardId: number;
    domainId: number;
    domainName: string;
}

class SelectedDomainLog {
    selectedLog: server.S_LogViewModel;
    originalDetail: server.S_DomainDetailViewModel;
    currentDetail: server.S_DomainDetailViewModel;

    synonyms: any[];

    constructor(log: server.S_LogViewModel = null) {
        if (log === undefined || log === null) {
            this.selectedLog = <server.S_LogViewModel>{};
            this.originalDetail = <server.S_DomainDetailViewModel>{};
            this.currentDetail = <server.S_DomainDetailViewModel>{};
        } else {
            this.selectedLog = log;
            this.originalDetail = (log.OriginalValue != null && log.OriginalValue != '')
                ? JSON.parse(log.OriginalValue)
                : <server.S_DomainDetailViewModel>{};
            this.currentDetail = (log.CurrentValue != null && log.CurrentValue != '')
                ? JSON.parse(log.CurrentValue)
                : <server.S_DomainDetailViewModel>{};
        }

        if (this.originalDetail.SynonymDomains === undefined || this.originalDetail.SynonymDomains === null) {
            this.originalDetail.SynonymDomains = [];
        }
        if (this.currentDetail.SynonymDomains === undefined || this.currentDetail.SynonymDomains === null) {
            this.currentDetail.SynonymDomains = [];
        }
        this.synonyms = [];

        this.initFields();
    }

    initFields(): void {
        let synonymLength = this.originalDetail.SynonymDomains.length > this.currentDetail.SynonymDomains.length
            ? this.originalDetail.SynonymDomains.length
            : this.currentDetail.SynonymDomains.length;

        for (let i = 0; i < synonymLength; i++) {
            let tempSyno = { key: '', value: '' };
            if (i < this.originalDetail.SynonymDomains.length) {
                tempSyno.key = this.originalDetail.SynonymDomains[i].SynonymDomainName;
            }
            if (i < this.currentDetail.SynonymDomains.length) {
                tempSyno.value = this.currentDetail.SynonymDomains[i].SynonymDomainName;
            }
            this.synonyms.push(tempSyno);
        }
    }
}

@Component({
    // moduleId: module.id,
    selector: 'standard-log',
    styleUrls: ['domain-log.component.css'],
    templateUrl: 'domain-log.component.html'
})
export class DomainLogComponent implements CloseGuard, OnInit, ModalComponent<DomainLogContext> {

    context: DomainLogContext;

    domainLogList: Array<server.S_LogViewModel>;
    selectedDomainLog = new SelectedDomainLog();

    //枚举
    enumLogAction = LogAction;
    enumLogAuditAction = LogAuditAction;
    enumDomainObservationType = DomainObservationType;
    enumDomainObservationTypeEn = DomainObservationTypeEn;

    constructor(public dialog: DialogRef<DomainLogContext>, private standardService: StandardService, private modal: Modal) {
        dialog.context.dialogClass = 'modal-dialog standard-modal-dialog';
        dialog.context.inElement = false;
        dialog.setCloseGuard(this);

        this.context = dialog.context;
    }

    ngOnInit(): void {
        this.standardService.getDomainLog(this.context.standardId, this.context.domainId)
            .subscribe((data) => {
                this.domainLogList = data;
                if (this.domainLogList.length > 0) {
                    this.selectedDomainLog = new SelectedDomainLog(this.domainLogList[0]);
                    //console.log(this.domainLogList[0]);
                    //console.log(this.selectedDomainLog);
                }
            });
    }

    /**
    * 设置选中的日志
    * @param log
    */
    setSelectedLog(log: server.S_LogViewModel): void {
        this.selectedDomainLog = new SelectedDomainLog(log);
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