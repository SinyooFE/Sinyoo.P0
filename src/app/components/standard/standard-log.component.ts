
import { Component, OnInit, ViewContainerRef, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';

import { DialogRef, ModalComponent, CloseGuard } from 'angular2-modal';
import { BSModalContext, BootstrapModalSize, Modal } from 'angular2-modal/plugins/bootstrap';

import { StandardService } from '../../services';

import { LogAction, LogAuditAction } from 'crabyter-p0-server/Enum';
import * as server from 'crabyter-p0-server/ViewModel';

import _ from 'lodash';

export class StandardLogContext extends BSModalContext {
    standardId: number;
    standardName: string;
}

class SelectedStandardLog {
    selectedLog: server.S_LogViewModel;
    originalDetail: server.S_StandardDetailViewModel;
    currentDetail: server.S_StandardDetailViewModel;

    constructor(log: server.S_LogViewModel = null) {
        if (log === undefined || log === null) {
            this.selectedLog = <server.S_LogViewModel>{};
            this.originalDetail = <server.S_StandardDetailViewModel>{};
            this.currentDetail = <server.S_StandardDetailViewModel>{};
        } else {
            this.selectedLog = log;
            this.originalDetail = (log.OriginalValue != null && log.OriginalValue != '')
                ? JSON.parse(log.OriginalValue)
                : <server.S_StandardDetailViewModel>{};
            this.currentDetail = (log.CurrentValue != null && log.CurrentValue != '')
                ? JSON.parse(log.CurrentValue)
                : <server.S_StandardDetailViewModel>{};
        }
    }
}

@Component({
    // moduleId: module.id,
    selector: 'standard-log',
    styleUrls: ['standard-log.component.css'],
    templateUrl: 'standard-log.component.html'
})
export class StandardLogComponent implements CloseGuard, OnInit, ModalComponent<StandardLogContext> {
    context: StandardLogContext;

    standardLogList: Array<server.S_LogViewModel> = [];
    selectedStandardLog = new SelectedStandardLog();

    //枚举
    enumLogAction = LogAction;
    enumLogAuditAction = LogAuditAction;

    constructor(public dialog: DialogRef<StandardLogContext>, private standardService: StandardService, private modal: Modal) {
        dialog.context.dialogClass = 'modal-dialog standard-modal-dialog';
        dialog.context.inElement = false;
        dialog.setCloseGuard(this);

        this.context = dialog.context;
    }

    ngOnInit(): void {
        this.standardService.getStandardLog(this.context.standardId)
            .subscribe((data) => {
                this.standardLogList = data;
                if (this.standardLogList.length > 0) {
                    this.selectedStandardLog = new SelectedStandardLog(this.standardLogList[0]);
                }
            });
    }

    /**
     * 设置选中的日志
     * @param log
     */
    setSelectedLog(log: server.S_LogViewModel): void {
        this.selectedStandardLog = new SelectedStandardLog(log);
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